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
		var requestParams = {}, model, batchSize = 1 || options.batchSize, batchRequestLimit = 10, batchRequestTimeout = 1;
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
				batchRequestLimit = 10;
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
				if(!value.disabled){
					_b.push(value);
				}
				return _m;
			}, []);
		
		var _disabled = _.where(options.queries, {disabled:true});
		
		//Process the batches
		var query64, _b;
		_.each(_batches, function(batch, i){
			//Format the queries
			var query = _.reduce(batch, function(memo, count){
				if(options.api === "curate"){
					count.ruleType = model.ruleTypes[count.type.toUpperCase()];
				}
				return memo + ((memo !== "")?model.SEP:"") + _.template(model.FORMAT, count);
			},"");
			
			//Hash the query
			query64 = base64(query);
			//Send an api request with the hashed query
			function _request(model, query64){
				$.getJSON(_.template(model.API, { network: options.network || "umg.fyre.co" , query: query64} ), requestParams, _.bind(self.handleResponse, self, callback));
			}
			if(options.shim){
				model.sampleResponse(_.bind(self.handleResponse, self, callback));
			}else{
				_b = Math.floor((i+1) / batchRequestLimit);
				if(batchRequestLimit && _b > 0 ){//ContentCount API only allows 10 requests per sec
					setTimeout(_.partial(_request, model, query64), batchRequestTimeout*_b);
				}else{
					_request(model, query64);
				}
			}
		});
		
		//Setup and pass the disabled items straight through.
		_.each(_disabled, function(dis){
			dis.id = dis.siteId+"_"+dis.articleId;
		});
		callback(_disabled);
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
							_timeline._count = _sum; //this is just the count over the timeline-range
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