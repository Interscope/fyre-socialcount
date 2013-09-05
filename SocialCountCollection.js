/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "backbone", "iga/utils/iga.backbone.custom",
        "iga/apps/fyre-socialcount/models/CurationCount", "iga/apps/fyre-socialcount/models/ContentCount",
        "iga/apps/fyre-socialcount/requestQueue"],
		function($, _, Backbone, IGABackbone, CurationCount, ContentCount, request){
	
	var SocialCountCollection = Backbone.Collection.extend({
		//model: ContentCount,
		counters: new Backbone.Model({total: 0, twitter: 0, facebook: 0, feed: 0, livefyre: 0}),
		initialize: function(models, options){
			this.config = options;
			switch(options.api){//@todo Add Heat Index support
				case "curate":
					this.model = CurationCount;
					break;
				default:
					this.model = ContentCount;
			}
			//When the total changes, update the individual models' % of total
			var counters = this.counters;
			counters.on("change:total", function(model, options){
				_.each(this.models, function(model){
					model.set("count.percentOfTotal", model.get("count.total") / counters.get("total") * 100);
				}, this);
			}, this);
			
			this.on("add", function(model){
				//When a model is added to this collection:
				//  Add the new model's counts to the Collection's counts
				_.each(counters, function(value, type){
					var _mv = model.get("count."+type);
					if(_mv){ counters.set(type, value + _mv); }
				});
			}, this);
			
			//When a model is removed 
			this.on("remove", function(model){
				//  update the collection counts
				_.each(counters, function(value, type){
					var _mv = model.get("count."+type);
					if(_mv){ counters.set(type, value - _mv); }
				});
			}, this);
				
			//  When a model count  changes
			model.on("change:count", function(model, options){
				var changes = model.changedAttributes(); 
				for(var attr in changes){
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
		requestCallback: function(counts){;
			//If the item is new add it with id=siteId_articleId .
			//	If the item already exists, merge it, and trigger a "change".
			_.each(counts, function(c){
				c.id = c.siteId+"_"+c.articleId;
				this.add(new this.model(c), {merge:true});//NOTE: counts from different apis will merge to the same model based on id.
			});
		},
		update: function(){
			this.trigger("update");
			//@TODO allow multiple request instances for content + curate (timeline) or heat
			new request(this.config).get(this.requestCallback);
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