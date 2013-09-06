/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "backbone", "iga/utils/iga.backbone.custom",
        "iga/apps/fyre-socialcount/models/BaseCount", "iga/apps/fyre-socialcount/models/CurationCount", "iga/apps/fyre-socialcount/models/ContentCount",
        "iga/apps/fyre-socialcount/requestQueue"],
		function($, _, utils, Backbone, IGABackbone, BaseCount, CurationCount, ContentCount, request){
	
	var SocialCountCollection = Backbone.Collection.extend({
		model: BaseCount,
		counters: new Backbone.Model({total: 0, twitter: 0, facebook: 0, feed: 0, livefyre: 0}),
		initialize: function(models, options){
			this.config = options;
			//When the total changes, update the individual models' % of total
			var counters = this.counters;
			counters.on("change", function(model, options){
				for(var attr in model.changed){
					_.each(this.models, function(model){
						_mv = model.get("count."+attr);
						if(_mv){ model.set("percent."+attr, _mv / counters.get(attr) * 100); }
					}, this);
				}
			}, this);
			
			this.on("add", function(model){
				//When a model is added to this collection:
				//@TODO add rank, percentile (count-rank-1)/count
				//  Add the new model's counts to the Collection's counts
				setTimeout(function(){
					_.each(counters.attributes, function(value, type){
						var _mv = model.get("count."+type);
						if(_mv){ counters.set(type, value + _mv); }
					});
				},0);
			}, this);
			
			//When a model is removed 
			this.on("remove", function(model){
				//  update the collection counts
				_.each(counters.attributes, function(value, type){
					var _mv = model.get("count."+type);
					if(_mv){ counters.set(type, value - _mv); }
				});
			}, this);
				
			//  When a model count  changes
			this.on("change:count", function(model, options){ 
				//@TODO percent.OfMaxTotal
				for(var attr in model.changed){
					if(counters[attr]){ //  and we have a collection counter for this attribute
						//  update the collection with the change in the attribute value.
						counters.set(attr, counters.get(attr) + (model.previousAttributes()[attr] - model[attr]));
					}
				}
			}, this);
		},
		serialize: function(){
			var data = {};
			data.counters = this.counters.attributes;
			data.collection = this.toJSON();	
			return data;
		},
		comparator: function(model){ //Used to sort models
			//@TODO Support different sort attributes, sort order
			switch(this.sortBy){
				default:
					return -model.get("total");
			}
		},
		requestCallback: function(request, counts){;
			//If the item is new add it with id=siteId_articleId .
			//	If the item already exists, merge it, and trigger a "change".
			var model, self = this;
			switch(request.api){//@todo Add Heat Index support
				case "curate":
					model = CurationCount;
					break;
				default:
					model = ContentCount;
			}
			_.each(counts, function(c){
				self.add(new model(c), {merge:true});//NOTE: counts from different apis will merge to the same model based on id.
			});
		},
		update: function(){
			var self = this;
			this.trigger("update");
			//Allow multiple request instances for content, curate (timeline), or heat
			_.each(this.config.requests, function(r){
				new request(r).get(_.bind(self.requestCallback, self, r));
			});
			this.trigger("updated");
		},
		/**
		 * @desc update the collection on a timeout
		 * @param interval
		 */
		updateEvery: function(interval){
			interval = interval || 15000; //default interval=15sec
			this.update();
			this.updateTimeout = setTimeout(_.bind(this.updateEvery, this, interval), interval);
		},
		start: function(){ this.update(); },
		stop: function(){
			clearTimeout(this.updateTimeout);
		}
	}).extend(IGA.Backbone.Events);
	
	return SocialCountCollection;
});