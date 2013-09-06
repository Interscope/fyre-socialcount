/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "hogan", "backbone",
        "iga/apps/fyre-socialcount/SocialCountCollection", 
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaign.tpl",
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaignItem.tpl",
        "css!iga/apps/fyre-socialcount/css/disclosure-inyourcity.css",
        /*"hgn!iga/apps/fyre-socialcount/templates/partials.tpl.html"*/],
		function($, _, utils, Hogan, Backbone, SocialCountCollection, CampaignTemplate, ItemTemplate, PartialTemplates){
	
	$.fn.childrenAndSelf = $.fn.childrenAndSelf || function(selector){
		return $(this[0]).find(selector).andSelf().filter(selector);
	};
	
	var SocialCountCollectionView = Backbone.View.extend({
		className: "iga-socialcount",
		$items: {},
		template: (function () {
			var self = this;
	        return function (data) {
	            var _template = self._template || CampaignTemplate;
	            if(typeof _template == "string"){
	            	_template = Hogan.compile(_template);
	        	}
	            //return _template.render(data, PartialTemplates);
	            return _template(data, PartialTemplates);
	        };
	    }()),
	    itemTemplate: (function () {
	    	var self = this;
	        return function (data) {
	            var _template = self._itemTemplate || ItemTemplate;
	            if(typeof _template == "string"){
	            	_template = Hogan.compile(_template);
	        	}
	            //return _template.render(data, PartialTemplates);
	            return _template(data, PartialTemplates);
	        };
	    }()),
	    render: function() {
	    	var self = this;
	    	var $rendered = this.template(this.collection.serialize());
	    	this.$el.append($rendered);
	    	this.$container = this.$el.find(this.options.container || ".iga-socialcount-container");
	    	_.each(this.collection.models, function(model){
	    		self.renderModel(model);
	    	});
	    	//Perform any needed jQuery on $el
	    	return this;
	    },
	    renderModel: function(model){
	    	var self = this, data = model.attributes;
	    	_.each(data.percent, function(p, key){
	    		data.percent[key] = utils.round(p, self.options.decimalPlaces || 2);
	    	});
	    	
	    	var $item = $(this.itemTemplate(data));
	    	//Add some jQuery maybe	
			self.$items[model.id] = $item;
			//Append the $item
	    	self.$container.append($item);
	    },
		initialize: function(options){
			var self = this;
			this.options = options;
			this.collection = this.collection || new SocialCountCollection([], options);
			//Render any new models
			this.collection.on("add", function(model){
				self.renderModel(model);
			});
			
			//Remove the $item from the view.
			this.collection.on("remove", function(model){
				self.$container.remove(self.views[model]);
				delete self.$items[model.id];//delete the reference too.
			});
			
			function _$change($c, value){
				$c.addClass("changed");
				setTimeout(function(){$c.removeClass("changed");}, options.changeAnimationTimeout || 3000);
				$c.text(value);
			}
			
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
							value = utils.round(value, self.options.decimalPlaces || 2);
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
								return memo+"bucket-"+attrClass+"-"+b.css;
							},""));
							//Add new bucket class
							for(var i in _buckets){
								bucket = _buckets[i];
								if(bucket.start <= value && bucket.stop >= value){
									$item.childrenAndSelf(".bucket-"+attrClass).addClass("bucket-"+attrClass+"-"+bucket.css);
									break;
								}
							};
						}
						
						$attr = $item.childrenAndSelf("."+attrClass).text(value);
						_$change($attr, value);
					}
				}
			}, this);
			
			this.collection.counters.on("change", function(model, value, options){
				var changes = model.changedAttributes();
				for(var attr in changes){
					value = model.get(attr);
					self.$el.find(".iga-socialcount-"+attr).text(value);
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