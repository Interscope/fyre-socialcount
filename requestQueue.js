/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc Request a bunch of counts, parse the response, and dump them out into a collection via a callback (async).
 */
define(["jquery", "underscore", "base64", "iga/apps/fyre-socialcount/models/CurationCount", "iga/apps/fyre-socialcount/models/ContentCount"],
		function($, _, base64, CurationCount, ContentCount){
	
	function requestQueue(options){
		options.api = options.api.toLowerCase();
		this.options = options;
		this._queries = _.reduce(options.queries, function(_queries, q){
			_queries[q.siteId+"_"+q.articleId] = q;
			return _queries;
		}, {});
	}
	
	requestQueue.prototype.get = function(callback){
		var options = this.options, self = this;
		var requestParams = {}, model, batchSize = 1 || options.batchSize;
		//@TODO Support Heat Index
		switch(options.api){
			case "curate":
				model = CurationCount;
				batchSize = 10;
				//@todo add params from & until
				//{from:, until:} //format=HH:MM_yyyymmdd
				break;
			case "content":
				model = ContentCount;
				break;
		}
		
		//Batch out the queries
		var _batches = _.reduce(options.queries, function(_m, value, i, _l){
				var _b = _.last(_m);
				if(!_b || _b.length >= batchSize){
					//create a new batch, else add to current batch
					_b = [];
					_m.push(_b);
				}
				_b.push(value);
				return _m;
			}, []);
		
		//Process the batches
		_.each(_batches, function(batch, i){
			//Format the queries
			var query = _.reduce(batch, function(memo, count){
				if(options.api === "curate"){
					count.ruleType = model.ruleTypes[count.type.toUpperCase()];
				}
				return memo + ((memo !== "")?model.SEP:"") + _.template(model.FORMAT, count);
			},"");
			
			//Hash the query
			var query64 = base64(query);
			//Send an api request with the hashed query
			if(options.shim){
				model.sampleResponse(_.bind(self.handleResponse, self, callback));
			}else{
				$.getJSON(_.template(model.API, { network: options.network || "umg.fyre.co" , query: query64} ), requestParams, _.bind(self.handleResponse, self, callback));
			}
		});
	};
	requestQueue.prototype.handleResponse = function(callback, response){
		var options = this.options, self = this;
		if(response.code == 200){
			var data = response.data, _data = [], _query ={};
			_.each(data, function(site, siteId){//each site {articles...}
				siteId = siteId.replace(/^site_/,"");
				_.each(site, function(article, articleId){//each article {types...}
					articleId = articleId.replace(/^article_/,"");
					var _query = {id: siteId+"_"+articleId ,siteId: siteId, articleId: articleId, count:{}}, _total=0;//create our data type
					
					_.each(article, function(value, typeId){//each rule-type [?...]
						//get the counts for each type.
						if(options.api === "curate"){
							var _sum = 0, _timeline = [], type = CurationCount.ruleTypes._inverted()[typeId].toLowerCase();
							//Add up all the values in the response tuples [#, time] 
							_sum = _.reduce(value, function(_sum, value, i, _l){
								_timeline.push({time:value[1], count:value[0]});// add the counts to the timeline
								return _sum + value[0];
							}, _sum);
							_query.count[type] = _sum;
							_query.timeline = _query.timeline || {};
							_query.timeline[type] = _query.timeline[type] || {};
							// add duration {from}_{until} level for multiple timeline support
							var _q = self._queries[_query.id], 
								_qd = ((_q.from || '')+"_"+(_q.until || '' )).replace('-','');
							_query.timeline[type][_qd] = _timeline;
						}else{
							_query.count[typeId] = value;
						}
						if(typeId !== "total"){_total+= value;}
					});	
					if(!_query.count.total){_query.count.total = _total;} //CurationCount doesn't return a total
					//merge data with options.queries
					_data.push(self.mergeData(_query));
				});	
			});
			//Return batch of data to callback([])
			callback(_data);
		}
	};
	
	requestQueue.prototype.mergeData = function(data){
		 return _.extend(this._queries[data.id], data);
	};
	
	return requestQueue;
});