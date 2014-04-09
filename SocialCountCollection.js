/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "backbone", "iga/utils/iga.backbone.custom",
        "iga/apps/fyre-socialcount/models/BaseCount", "iga/apps/fyre-socialcount/models/CurationCount", "iga/apps/fyre-socialcount/models/ContentCount",
        "iga/apps/fyre-socialcount/requestQueue"],
		function($, _, Backbone, IGABackbone, BaseCount, CurationCount, ContentCount, request){
	
	var SocialCountCollection = Backbone.Collection.extend({
		model: BaseCount,
		counters: new Backbone.Model({total: 0, twitter: 0, facebook: 0, feed: 0, livefyre: 0}),
		initialize: function(models, options){
			this.options = _.extend( {sortBy:"count.total"}, options);
			//When the total changes, update the individual models' % of total
			var counters = this.counters;
			counters.on("change", function(model, options){
				var _count;
				for(var attr in model.changed){
					_count = counters.get(attr);
					_.each(this.models, function(model){
						_mv = model.get("count."+attr);
						if( _count === 0 ){ model.set("percent."+attr, 1 / this.models.length * 100); }//if we don't have any counts, set each percent to 1/# of models
						else if(_mv){ model.set("percent."+attr, _mv / _count * 100); }
					}, this);
				}
			}, this);
			
			this.on("add", function(model){
				//When a model is added to this collection:
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
				for(var attr in model.changed){
					if(counters[attr]){ //  and we have a collection counter for this attribute
						//  update the collection with the change in the attribute value.
						counters.set(attr, counters.get(attr) + (model.previousAttributes()[attr] - model[attr]));
					}
				}
			}, this);
			
			this.on("sort", function(c, o){
				var _top = this.models[0], _sortBy = this.options.sortBy;
				
				_.each(this.models, function(model, i){
					var _rank = i+1,
						_percentile = (this.models.length-i-0.5)*100/this.models.length; 
					model.set("order.rank", _rank);
					model.set("order.percentile", _percentile);//ordinal-rank percentile
					model.set("percent.OfTop", model.get(_sortBy) / _top.get(_sortBy) * 100);//percent of the highest in the collection
				}, this);
			}, this);
			
		},
		serialize: function(){
			var data = {};
			data.counters = this.counters.attributes;
			data.collection = this.toJSON();	
			return data;
		},
		comparator: function(model){ //Used to sort models
			return -model.get(this.options.sortBy);
		},
		_responseCount: 0,
		requestCallback: function(request, counts, args){
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
			if(args && args.requestCount){
				this._responseCount++;
				if( this._responseCount === args.requestCount ){
					this.trigger("updated");
					this._responseCount = 0;
				}
			}
		},
		update: function(){
			var self = this;
			this.trigger("updating");
			//Allow multiple request instances for content, curate (timeline), or heat
			_.each(this.options.requests, function(r){
				new request(r).get(_.bind(self.requestCallback, self, r));
			});
		},
		/**
		 * @desc update the collection on a timeout
		 * @param interval
		 */
		updateEvery: function(interval){
			var _i = (interval || 15)*1000, self = this; //default interval=15sec
			this.update();
			this.updateTimeout = setTimeout(_.bind(this.updateEvery, this, interval), _i);
		},
		//@TODO Dynamic back-off polling [5000, 30000]
		start: function(){ this.update(); },
		stop: function(){
			clearTimeout(this.updateTimeout);
		}
	}).extend(IGA.Backbone.Events);
	
	return SocialCountCollection;
});