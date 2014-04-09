/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "hogan", "backbone",
        "iga/apps/fyre-socialcount/SocialCountCollection", 
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaign.tpl",
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaignItem.tpl",
        "iga/apps/fyre-socialcount/templates/partials.html",
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
            	_template = Hogan.compile(_template);//for html(.js) templates
        	}
            return _template(data, PartialTemplates);
	    },
	    itemTemplate: function (data) {
            var _template = this._itemTemplate || ItemTemplate;
            if(typeof _template == "string"){
            	_template = Hogan.compile(_template);//for html(.js) templates
        	}
            return _template(data, PartialTemplates);
        },
	    render: function() {
	    	var self = this;
	    	var $rendered = this.template(this.collection.serialize());
	    	this.$el.append($rendered);
	    	this.$container = this.$el.find(this.options.container || ".iga-socialcount-container");
	    	_.each(this.collection.models, function(model){//render the models already in the collection
	    		self.renderModel(model);
	    	});
	    	this.trigger("render", this);//the collection is rendered!
	    	return this;
	    },
	    renderModel: function(model){
	    	var self = this, attrs = model.attributes;
	    	_.each(attrs.percent, function(p, key){
	    		attrs.percent[key] = utils.round(p, self.options.decimalPlaces || 2);
	    	});
	    	
	    	var $item = $(this.itemTemplate(attrs));//render the item
	    	$item.data("model", model);
			self.$items[model.id] = $item;
			//Append the $item in sorted order
			if(_.size(self.$items) == 1 || model == _.last(self.collection.models)){
				self.$container.append($item);
			}else{
				var index = -1, previousModel = null, $previousItem = null, nextModel = null, $nextItem = null;
				_.find(self.collection.models, function(m){ index++; return m === model; });
				
				for(var i=0; (index > 0+i || index+1+i < self.collection.models.length ) &&  !$previousItem && !$nextItem ; i++){
					previousModel = (index-1-i > 0) ? self.collection.models[index-1-i] : null;
					$previousItem = (previousModel) ? self.$items[previousModel.id] : null;
					nextModel = (index+1+i < self.collection.models.length) ? self.collection.models[index+1+i] : null;
					$nextItem = (nextModel) ? self.$items[nextModel.id] : null;
				}
				
				if($previousItem){
					$item.insertAfter($previousItem);
				}else if($nextItem){
					$item.insertBefore($nextItem);
				}
			}
	    	this.trigger("renderModel", $item, model);//Apply view-specific rendering
	    	return $item;
	    },
	    loaded: false,
		initialize: function(options){
			var self = this;
			this.options = options;
			
			//#Process configuration options
			//Create buckets for each type
			if(self.options.buckets){//@todo buckets of size < 1
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
				self.once("loaded", function(){
					var $item = self.renderModel(model);
					//which data attributes do we want to update in the view?
					_$updateView($item, model, _.pick(model.attributes, "count", "percent","heat"));
				});
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
			
			function _$updateView($item, model, attrs, options){
				var value, $attr, attrPath, attrClass;
				for(var _attr in attrs ){
					for(var attr in attrs[_attr]){
						attrPath =_attr+"."+attr;
						value = model.get(attrPath);
						if(_attr === "percent"){
							attrClass = "percent" + (attr.match(/^Of|Or/)?attr:("Of"+utils.toProperCase(attr)) );
							//update percent widths & heights
							$item.childrenAndSelf(".width-"+attrClass).css({ width:value+"%" });
							$item.childrenAndSelf(".height-"+attrClass).css({ height:value+"%" });
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
			}
			
			this.once("loaded", function(){
				self.collection.on("change:count change:percent change:heat change:order", function(model, value, options){// change:order
					//update the view for the model
					var $item = self.$items[model.id],//find the jQuery element for this model
						changes = utils.diff(_.pick(model.changed, "count", "percent","heat", "order"), model._previousAttributes); //NestedModel needs to diff nested changes
					if(!$item){return;}
					_$updateView($item, model, changes, options);
				});
				
				self.collection.counters.on("change", function(counter, value, options){
					var $attr;
					for(var attr in counter.changed){
						value = counter.get(attr);
						$attr = self.$el.find(".iga-socialcount-"+attr);
						_$setAttr($attr, value, attr);
					}
				});
				
				if(self.collection.counters.get("total") === 0){
					self.collection.counters.set("total",1);//force an update of percentOfTotal
					self.collection.counters.set("total",0);
				}
				
			});
			
		},
		start: function(options){
			var self = this;
			if(typeof options === "number"){
				options = {interval:options};
			}
			options = options || {};
			this.$el.addClass("loading");
			this.collection.once("updated", function(){//once all the items are loaded
				setTimeout(function(){// and all the triggers have fired
					self.$el.removeClass("loading").addClass("loaded");
					self.loaded = true;
					self.trigger("loaded");
				}, 0);
			});
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