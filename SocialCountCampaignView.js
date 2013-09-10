/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "hogan", "backbone",
        "iga/apps/fyre-socialcount/SocialCountCollection", 
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaign.tpl",
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaignItem.tpl",
        /*"hgn!iga/apps/fyre-socialcount/templates/partials.tpl.html"*/
        "css!iga/apps/fyre-socialcount/css/fyre-socialcount.css",],
		function($, _, utils, Hogan, Backbone, SocialCountCollection, CampaignTemplate, ItemTemplate, PartialTemplates){
	
	$.fn.childrenAndSelf = $.fn.childrenAndSelf || function(selector){
		return $(this[0]).find(selector).andSelf().filter(selector);
	};
	
	var SocialCountCollectionView = Backbone.View.extend({
		className: "iga-socialcount",
		$items: {},
		template: function (data) {
            var _template = this._template || CampaignTemplate;
            if(typeof _template == "string"){
            	_template = Hogan.compile(_template);
        	}
            //return _template.render(data, PartialTemplates);
            return _template(data, PartialTemplates);
	    },
	    itemTemplate: function (data) {
            var _template = this._itemTemplate || ItemTemplate;
            if(typeof _template == "string"){
            	_template = Hogan.compile(_template);
        	}
            //return _template.render(data, PartialTemplates);
            return _template(data, PartialTemplates);
        },
	    render: function() {
	    	var self = this;
	    	var $rendered = this.template(this.collection.serialize());
	    	this.$el.append($rendered);
	    	this.$container = this.$el.find(this.options.container || ".iga-socialcount-container");
	    	_.each(this.collection.models, function(model){
	    		self.renderModel(model);
	    	});	    	
	    	//Perform any needed jQuery on $el
	    	this.trigger("render", this);
	    	return this;
	    },
	    renderModel: function(model){
	    	var self = this, data = model.attributes;
	    	_.each(data.percent, function(p, key){
	    		data.percent[key] = utils.round(p, self.options.decimalPlaces || 2);
	    	});
	    	
	    	var $item = $(this.itemTemplate(data));
			self.$items[model.id] = $item;
			//Append the $item
	    	self.$container.append($item);
	    	return $item;
	    },
		initialize: function(options){
			var self = this;
			this.options = options;
			
			//#Process configuration options
			//Create buckets for each type
			if(self.options.buckets){
				self.options.buckets = _.reduce(self.options.buckets, function(_buckets, bucket, attr){
					if(typeof bucket !== "array"){
						var _max = bucket.max || 100, 
							_step = bucket.step || 10;
						_buckets[attr] = _.map(_.range(0, _max, _step), function(v, i){
							var _stop = v + _step - 1;
							return {start: v, stop: _stop, css:v+"to"+_stop };
						});
						_buckets[attr].push({start: _max, stop:_max , css:_max+"plus" });
					}
					return _buckets;
				}, self.options.buckets);
			}
			
			this.collection = this.collection || new SocialCountCollection([], options);
			//Render any new models
			this.collection.on("add", function(model){
				var $item = self.renderModel(model);
				$item.data("model", model);
			});
			
			//Remove the $item from the view.
			this.collection.on("remove", function(model){
				self.$container.remove(self.views[model]);
				delete self.$items[model.id];//delete the reference too.
			});
			
			//.changed class whenever an attribute changes.
			function _$change($c){
				$c.addClass("changed");
				setTimeout(function(){$c.removeClass("changed");}, options.changeAnimationTimeout || 2000);
			}
			
			function _$setAttr($attr, value, attrPath){
				if(attrPath.indexOf("percent")===0){
					value = utils.round(value, self.options.decimalPlaces || 2)+"%";//trigger changed even when change is < rounding
				}
				if($attr.is("meta")){
					$attr.attr("content", value);
				}else{
					$attr.text(value);
					_$change($attr);
				}
			}
			
			this.collection.on("change:count change:percent change:heat", function(model, value, options){
				//update the view for the model
				var $attr, attrPath, attrClass;
					$item = self.$items[model.id],//find the jQuery element for this model
					changes = utils.diff(model.changed, model._previousAttributes); //NestedModel needs to diff nested changes
				if(!$item){return;}
				for(var _attr in changes ){
					for(var attr in changes[_attr]){
						attrPath =_attr+"."+attr;
						value = model.get(attrPath);
						if(_attr === "percent"){
							attrClass = "percent" + (attr.match(/^Of|Or/)?attr:("Of"+utils.toProperCase(attr)) );
							//update percent widths & heights
							$item.childrenAndSelf(".width-"+attrClass).css({width:value+"%"});
							$item.childrenAndSelf(".height-"+attrClass).css({height:value+"%"});
						}else if(_attr === "heat"){
							attrClass = "heat-"+attr;
						}else{
							attrClass = attr;
						}
						
						//allow bucket-based classes .bucket-percentOfTotal-0to9 ... .bucket-percentOfTotal-30to29 ...
						if(self.options.buckets && self.options.buckets[attrPath]){
							var _buckets = self.options.buckets[attrPath];
							//remove any old bucket classes
							$item.childrenAndSelf(".bucket-"+attrClass).removeClass(_.reduce(_buckets, function(memo, b){
								if(memo !==""){memo+=" ";}
								return memo+attrClass+"-"+b.css;
							},""));
							//Add new bucket class
							for(var i in _buckets){
								bucket = _buckets[i];
								if(bucket.start <= value && (typeof bucket.stop === "undefined" || bucket.stop+1 > value)){// 0to9 will include 9.xx
									$item.childrenAndSelf(".bucket-"+attrClass).addClass(attrClass+"-"+bucket.css);
									break;
								}
							};
						}
						$attr = $item.childrenAndSelf("."+attrClass);
						_$setAttr($attr, value, attrPath);
						_$change($item);
					}
				}
			}, this);
			
			this.collection.counters.on("change", function(counter, value, options){
				var $attr;
				for(var attr in counter.changed){
					value = counter.get(attr);
					$attr = self.$el.find(".iga-socialcount-"+attr);
					_$setAttr($attr, value, attr);
				}
			});
			
		},
		start: function(options){
			if(typeof options === "number"){
				options = {interval:options};
			}
			options = options || {};
			//Update & poll the collection
			if(options.interval){
				this.collection.updateEvery(options.interval);
			}else{
				this.collection.update();
			}
			return this;
		}
	});
	
	return SocialCountCollectionView;
});