
define('iga/utils/iga.backbone.custom',["backbone", "IGA"], function(Backbone, IGA){
	//#IGA.Backbone.Events
	//`_compare` Global comparator function
	function _compare(attr, _comp, fn,  model, value, options){
	  if(_comp(model, value, options)){
	    fn(model, value);
	    return true;
	  }
	  return false;
	}
	//Comparators to test if the attribute has crossed a threshold.
	function _over(hurdle,  model, value){
	  if(value > hurdle){ return true; } return false;
	}
	function _under(hurdle,  model, value){
	  if(value < hurdle){ return true; } return false;
	}
	
	IGA.Backbone = IGA.Backbone || { };
	IGA.Backbone.Events = {
	  onceHurdle: function(attr, _comp, fn){
		function _once(){
			var _h, _f = _.bind(function(model, value, options){
				//Once we're over the hurdle, fire our callback 
	    		this.off("change:"+ attr, _h); //  and unbind from change:
	    		return fn(model, value, options);
			}, this);
			_h = _.partial(_compare, attr, _comp, _f);
			//Are we already over this hurdle?
			if(!_h(this, this.get(attr))){
				//No? Well, if anything changes...
				this.on("change:"+attr, _h);
			}
		}
		if(this.models){
			_.each(this.models, function(model, i){ //If bound to a collection 
				_.bind(_once, model)();// add `_once` hurdle check to each model
			});
			this.on("add", function(model){
				_.bind(_once, model)();// and any new models
			});
		}else{
			_once();
		}
	    return this;
	  },
	  onceOver: function(attr, hurdle, fn){
		this.onceHurdle(attr, _.partial(_over, hurdle), fn);
		return this;
	  },
	  onceUnder: function(attr, hurdle, fn){
		this.onceHurdle(attr, _.partial(_under, hurdle), fn);
		return this;
	  }
	};
	
	//To extend a Backbone Model with our custom events: `Backbone.Model.extend({ ... }).extend(IGA.Backbone.Events);`
	return IGA.Backbone;
});
(function($){var _delayedTriggers=[];Backbone.NestedModel=Backbone.Model.extend({get:function(attrStrOrPath){var attrPath=Backbone.NestedModel.attrPath(attrStrOrPath),result;Backbone.NestedModel.walkPath(this.attributes,attrPath,function(val,path){var attr=_.last(path);if(path.length===attrPath.length){result=val[attr]}});return result},has:function(attr){var result=this.get(attr);return!(result===null||_.isUndefined(result))},set:function(key,value,opts){var newAttrs=Backbone.NestedModel.deepClone(this.attributes),attrPath;if(_.isString(key)){attrPath=Backbone.NestedModel.attrPath(key)}else if(_.isArray(key)){attrPath=key}if(attrPath){opts=opts||{};this._setAttr(newAttrs,attrPath,value,opts)}else{opts=value||{};var attrs=key;for(var _attrStr in attrs){if(attrs.hasOwnProperty(_attrStr)){this._setAttr(newAttrs,Backbone.NestedModel.attrPath(_attrStr),opts.unset?null:attrs[_attrStr],opts)}}}if(!this._validate(newAttrs,opts)){this.changed={};return false}if(opts.unset&&attrPath&&attrPath.length===1){var unsetObj={};unsetObj[key]=null;Backbone.NestedModel.__super__.set.call(this,unsetObj,opts)}else{if(opts.unset&&attrPath){opts=_.extend({},opts);delete opts.unset}Backbone.NestedModel.__super__.set.call(this,newAttrs,opts)}this._runDelayedTriggers();return this},clear:function(options){options=options||{};if(!options.silent&&this.validate&&!this.validate({},options)){return false}var changed=this.changed={};var model=this;var setChanged=function(obj,prefix){_.each(obj,function(val,attr){var changedPath=prefix;if(_.isArray(obj)){changedPath+="["+attr+"]"}else if(prefix){changedPath+="."+attr}else{changedPath=attr}val=obj[attr];if(_.isObject(val)){setChanged(val,changedPath)}if(!options.silent)model._delayedChange(changedPath,null);changed[changedPath]=null})};setChanged(this.attributes,"");this.attributes={};this._escapedAttributes={};if(!options.silent)this._delayedTrigger("change");this._runDelayedTriggers();return this},add:function(attrStr,value,opts){var current=this.get(attrStr);if(!_.isArray(current))throw new Error("current value is not an array");return this.set(attrStr+"["+current.length+"]",value,opts)},remove:function(attrStr,opts){opts=opts||{};var attrPath=Backbone.NestedModel.attrPath(attrStr),aryPath=_.initial(attrPath),val=this.get(aryPath),i=_.last(attrPath);if(!_.isArray(val)){throw new Error("remove() must be called on a nested array")}var trigger=!opts.silent&&val.length>=i+1,oldEl=val[i];val.splice(i,1);opts.silent=true;this.set(aryPath,val,opts);if(trigger){attrStr=Backbone.NestedModel.createAttrStr(aryPath);this.trigger("remove:"+attrStr,this,oldEl);for(var aryCount=aryPath.length;aryCount>=1;aryCount--){attrStr=Backbone.NestedModel.createAttrStr(_.first(aryPath,aryCount));this.trigger("change:"+attrStr,this,oldEl)}this.trigger("change",this,oldEl)}return this},toJSON:function(){return Backbone.NestedModel.deepClone(this.attributes)},_delayedTrigger:function(){_delayedTriggers.push(arguments)},_delayedChange:function(attrStr,newVal){this._delayedTrigger("change:"+attrStr,this,newVal);if(!this.changed){this.changed={}}this.changed[attrStr]=newVal},_runDelayedTriggers:function(){while(_delayedTriggers.length>0){this.trigger.apply(this,_delayedTriggers.shift())}},_setAttr:function(newAttrs,attrPath,newValue,opts){opts=opts||{};var fullPathLength=attrPath.length;var model=this;Backbone.NestedModel.walkPath(newAttrs,attrPath,function(val,path){var attr=_.last(path);var attrStr=Backbone.NestedModel.createAttrStr(path);var isNewValue=!_.isEqual(val[attr],newValue);if(path.length===fullPathLength){if(opts.unset){delete val[attr];delete model._escapedAttributes[attrStr]}else{val[attr]=newValue}if(!opts.silent&&_.isObject(newValue)&&isNewValue){var visited=[];var checkChanges=function(obj,prefix){if(visited.indexOf(obj)>-1){return}else{visited.push(obj)}var nestedAttr,nestedVal;for(var a in obj){if(obj.hasOwnProperty(a)){nestedAttr=prefix+"."+a;nestedVal=obj[a];if(!_.isEqual(model.get(nestedAttr),nestedVal)){model._delayedChange(nestedAttr,nestedVal)}if(_.isObject(nestedVal)){checkChanges(nestedVal,nestedAttr)}}}};checkChanges(newValue,attrStr)}if(newValue===null){var parentPath=Backbone.NestedModel.createAttrStr(_.initial(attrPath));model._delayedTrigger("remove:"+parentPath,model,val[attr])}}else if(!val[attr]){if(_.isNumber(attr)){val[attr]=[]}else{val[attr]={}}}if(!opts.silent){if(path.length>1&&isNewValue){model._delayedChange(attrStr,val[attr])}if(_.isArray(val[attr])){model._delayedTrigger("add:"+attrStr,model,val[attr])}}})}},{attrPath:function(attrStrOrPath){var path;if(_.isString(attrStrOrPath)){path=attrStrOrPath===""?[""]:attrStrOrPath.match(/[^\.\[\]]+/g);path=_.map(path,function(val){return val.match(/^\d+$/)?parseInt(val,10):val})}else{path=attrStrOrPath}return path},createAttrStr:function(attrPath){var attrStr=attrPath[0];_.each(_.rest(attrPath),function(attr){attrStr+=_.isNumber(attr)?"["+attr+"]":"."+attr});return attrStr},deepClone:function(obj){return $.extend(true,{},obj)},walkPath:function(obj,attrPath,callback,scope){var val=obj,childAttr;for(var i=0;i<attrPath.length;i++){callback.call(scope||this,val,attrPath.slice(0,i+1));childAttr=attrPath[i];val=val[childAttr];if(!val)break}}})})(jQuery);
define("backbone.nestedmodel", function(){});

/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API
 */
define('iga/apps/fyre-socialcount/models/BaseCount',["jquery", "underscore", "IGA.utils", "backbone", "backbone.nestedmodel"],
		function($, _, utils, Backbone, NestedModel){
	
	var BaseCount = Backbone.NestedModel.extend({
		defaults:{},
		initialize: function(attributes, options){
			var self = this;
			this.config = options;
			if(attributes.data){
				if(attributes.data.name){
					attributes.data.Name = attributes.data.name;
					attributes.data.name = attributes.data.Name.toLowerCase();
					attributes.data.cssName = attributes.data.name.replace(/[_\s]/g,"-").replace(/[#\.\/\\]/g, '');
				}
				
				if(attributes.data.goal){
					this.set({"percent.ToGoal": 0, "percent.OfGoal": 0 }, {silent:true});
					this.on("change:count.total", function(model, value, options){
							var _p = value / this.get("data.goal") * 100;
							model.set("percent.OfGoal", _p);
							model.set("percent.ToGoal", Math.min(100, _p));
					}, this);
				}
				
				attributes.url = window.location;
			}
			
			//Helper Lambda Expression Functions
			attributes.urlEncode = function(){
				return function(text){ return encodeURIComponent(_.template(text, self.attributes)); };
			};
			attributes.htmlEncode = function(){
				return function(text){ return $('<div/>').text(_.template(text, self.attributes)).html(); };
			};
			attributes.round = function(){
				return function(text){
					var p = text.split(',');
					if(p.length >= 2){
						p[0] = _.template(p[0], self.attributes);
						return utils.round(p[0], p[1]);
					}
					return "";  
				};
			};
			attributes.formatDate = function(){
				return function(text){
					var p = text.split(',');
					if(p.length >= 2){
						p[0] = _.template(p[0], self.attributes);
						return utils.dateFormat(p[0], p[1]);
					}
					return "";  
				};
			};
			//Add some view-layer attributes
			attributes.cssSafeId = attributes.id.replace("_","-").replace(/[#\.]/g, '');
			//Update the module attributes, but don't trigger a change
			this.set(attributes, {silent:true});
		}
	});
	
	return BaseCount;
});
/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Curation-Count-API-%28DRAFT%29
 */
define('iga/apps/fyre-socialcount/models/CurationCount',["jquery", "underscore", "IGA.utils", "backbone", "backbone.nestedmodel", "iga/apps/fyre-socialcount/models/BaseCount"],
		function($, _, utils, Backbone, NestedModel, BaseCountModel){
	
	var CurationCount = BaseCountModel.extend({});
	
	CurationCount.API = 'http://bootstrap.{{network}}/api/v3.0/stats.collections.curate/{{query}}.json';
	CurationCount.FORMAT = "{{siteId}}:{{articleId}};{{ruleType}}";
	CurationCount.SEP = ",";
	CurationCount.ruleTypes = { "TWITTER": 2 };
	CurationCount.ruleTypes._inv = null;
	CurationCount.ruleTypes._inverted= function(){
		if(!CurationCount.ruleTypes._inv){
			CurationCount.ruleTypes._inv = _.invert(CurationCount.ruleTypes);
		}
		return CurationCount.ruleTypes._inv;
	};
	CurationCount.sampleResponse = function(callback){ require(["text!iga/apps/fyre-socialcount/models/curation-count-sample.json", "json2"], function(data, JSON){
		return callback(JSON.parse(data));
	} ); };
	
	return CurationCount;
});
/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API
 */
define('iga/apps/fyre-socialcount/models/ContentCount',["jquery", "underscore", "IGA.utils", "backbone", "backbone.nestedmodel", "iga/apps/fyre-socialcount/models/BaseCount"],
		function($, _, utils, Backbone, NestedModel, BaseCountModel){
	
	var ContentCount = BaseCountModel.extend({});
	
	ContentCount.FORMAT = "{{siteId}}:{{articleId}}";
	ContentCount.SEP = ",";
	ContentCount.API = 'http://bootstrap.{{network}}/api/v1.1/public/comments/ncomments/{{query}}.json';
	ContentCount.sampleResponse = function(callback){ require(["text!iga/apps/fyre-socialcount/models/content-count-sample.json", "json2"], function(data, JSON){
		return callback(JSON.parse(data));
	} ); };
	
	return ContentCount;
});
(function(){var t="undefined"!=typeof window?window:exports,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n=function(){try{document.createElement("$")}catch(t){return t}}();t.btoa||(t.btoa=function(t){for(var o,e,a=0,c=r,f="";t.charAt(0|a)||(c="=",a%1);f+=c.charAt(63&o>>8-8*(a%1))){if(e=t.charCodeAt(a+=.75),e>255)throw n;o=o<<8|e}return f}),t.atob||(t.atob=function(t){if(t=t.replace(/=+$/,""),1==t.length%4)throw n;for(var o,e,a=0,c=0,f="";e=t.charAt(c++);~e&&(o=a%4?64*o+e:e,a++%4)?f+=String.fromCharCode(255&o>>(6&-2*a)):0)e=r.indexOf(e);return f})})();
define("base64", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.btoa;
    };
}(this)));

/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc Request a bunch of counts, parse the response, and dump them out into a collection via a callback (async).
 */
define('iga/apps/fyre-socialcount/requestQueue',["jquery", "underscore", "base64", "iga/apps/fyre-socialcount/models/CurationCount", "iga/apps/fyre-socialcount/models/ContentCount"],
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
				_b.push(value);
				return _m;
			}, []);
		
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
/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define('iga/apps/fyre-socialcount/SocialCountCollection',["jquery", "underscore", "IGA.utils", "backbone", "iga/utils/iga.backbone.custom",
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
				var _count;
				for(var attr in model.changed){
					_count = counters.get(attr);
					_.each(this.models, function(model){
						_mv = model.get("count."+attr);
						if( _count === 0 ){ model.set("percent."+attr, 1 / self.models.length * 100); }//if we don't have any counts, set each percent to 1/# of models
						else if(_mv){ model.set("percent."+attr, _mv / _count * 100); }
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
					return -model.get("count.total");
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
		//@TODO Dynamic back-off polling [5000, 30000]
		start: function(){ this.update(); },
		stop: function(){
			clearTimeout(this.updateTimeout);
		}
	}).extend(IGA.Backbone.Events);
	
	return SocialCountCollection;
});
define("hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaign.tpl", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div>\r");_.b("\n" + i);_.b("	<div class=\"iga-socialcount-container\"></div>\r");_.b("\n" + i);_.b("	<meta class=\"iga-socialcount-total\" itemprop=\"counters.total\" content=\"");_.b(_.v(_.d("counters.total",c,p,0)));_.b("\" />\r");_.b("\n" + i);_.b("</div>");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define("hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaignItem.tpl", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<article id=\"");_.b(_.v(_.f("cssSafeId",c,p,0)));_.b("\" class=\"");_.b(_.v(_.d("data.name",c,p,0)));if(_.s(_.d("data.disabled",c,p,1),c,p,0,66,75,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" disabled");});c.pop();}_.b("\">\r");_.b("\n" + i);_.b("	<div class=\"bar\">\r");_.b("\n" + i);_.b("		<p class=\"width-percentOfTotal\">\r");_.b("\n" + i);_.b("			<span class=\"hashtag\"><a href=\"https://twitter.com/intent/tweet?text=");if(_.s(_.f("urlEncode",c,p,1),c,p,0,239,265,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.v(_.d("data.twitterIntentText",c,p,0)));});c.pop();}_.b("&hashtags=");_.b(_.v(_.d("data.hashtag",c,p,0)));_.b("&related=interscope&url=");if(_.s(_.f("urlEncode",c,p,1),c,p,0,343,355,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.v(_.d("url.href",c,p,0)));});c.pop();}_.b("\" target=\"_blank\" >#");_.b(_.v(_.d("data.hashtag",c,p,0)));_.b("</a></span>\r");_.b("\n" + i);_.b("			<span class=\"percentOfTotal\">");_.b(_.v(_.d("percent.otal",c,p,0)));_.b("</span>\r");_.b("\n" + i);_.b("		</p>\r");_.b("\n" + i);_.b("	</div>\r");_.b("\n" + i);_.b("</article>\r");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

/**	`css` is a requirejs plugin
	that loads a css file and inject it into a page.
	note that this loader will return immediately,
	regardless of whether the browser had finished parsing the stylesheet.
	this css loader is implemented for file optimization and depedency managment
 */

define('css',{
	load: function (name, require, load, config) {
		function inject(filename)
		{
			var head = document.getElementsByTagName('head')[0];
			var link = document.createElement('link');
			link.href = filename;
			link.rel = 'stylesheet';
			link.type = 'text/css';
			head.appendChild(link);
		}
		inject(requirejs.toUrl(name));
		load(true);
	}
	,pluginBuilder: './css-build'
});

define('css-embed', function()
{
	function embed_css(content)
	{
		var head = document.getElementsByTagName('head')[0],
		style = document.createElement('style'),
		rules = document.createTextNode(content);
		style.type = 'text/css';
		if(style.styleSheet)
			style.styleSheet.cssText = rules.nodeValue;
		else style.appendChild(rules);
			head.appendChild(style);
	}
	return embed_css;
});

define('css!iga/apps/fyre-socialcount/css/fyre-socialcount.css', ['css-embed'], 
function(embed)
{
	embed(
	'div.iga-socialcount-container .bar{ color: #fff; clear:both;} div.iga-socialcount-container .bar:hover{ opacity:.8;} div.iga-socialcount-container .bar .width-percentOfTotal{  background-color: #2558FF;  display:block;  position:relative;  margin:1px 0 0 0;  padding: .5em 4em .5em .5em;  -webkit-transition:background-color .3s ease-out; -moz-transition:background-color .3s ease-out; transition:background-color .3s ease-out; }  div.iga-socialcount-container .bar .width-percentOfTotal a, div.iga-socialcount-container .bar .width-percentOfTotal a:visited{ color:#fff; -webkit-transition:color .5s; -moz-transition:color .5s; transition:color .5s; }  div.iga-socialcount-container .bar .width-percentOfTotal a:hover{ color:#3f3f44;}  div.iga-socialcount-container .bar .percentOfTotal{ position:absolute; top:25%; right:0; padding-right:5px; }'
	);
	return true;
});

/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define('iga/apps/fyre-socialcount/SocialCountCampaignView',["jquery", "underscore", "IGA.utils", "hogan", "backbone",
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
define("hgn!iga/apps/fyre-socialcount/templates/Disclosure-InYourCity-Item.tpl", ["hogan"], function(hogan){  var tmpl = new hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<article id=\"");_.b(_.v(_.f("cssSafeId",c,p,0)));_.b("\" class=\"university ");_.b(_.v(_.d("data.cssName",c,p,0)));_.b(" ");if(_.s(_.d("data.disabled",c,p,1),c,p,0,81,93,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("disqualified");});c.pop();}_.b(" bucket-percentOfTotal\">\r");_.b("\n" + i);_.b("	<div class=\"info\">\r");_.b("\n" + i);_.b("		<h3 class=\"Name\">");_.b(_.v(_.d("data.Name",c,p,0)));_.b("</h3> <span class=\"date\">");if(_.s(_.f("formatDate",c,p,1),c,p,0,230,250,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.v(_.d("data.date",c,p,0)));_.b(",mmm dd");});c.pop();}_.b("</span>\r");_.b("\n" + i);_.b("		<p class=\"hashtag\"><a href=\"https://twitter.com/intent/tweet?text=");if(_.s(_.f("urlEncode",c,p,1),c,p,0,356,417,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Tweet #");_.b(_.v(_.d("data.hashtag",c,p,0)));_.b(" to win a secret show from @disclosure");});c.pop();}_.b("&related=disclosure,interscope&url=");if(_.s(_.f("urlEncode",c,p,1),c,p,0,480,492,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.v(_.d("url.href",c,p,0)));});c.pop();}_.b("\" target=\"_blank\" >#");_.b(_.v(_.d("data.hashtag",c,p,0)));_.b("</a></p>\r");_.b("\n" + i);_.b("		<p class=\"percentOfTotal\">");_.b(_.v(_.d("percent.total",c,p,0)));_.b("</p>\r");_.b("\n" + i);_.b("		<p class=\"total\" style=\"display:none;\">");_.b(_.v(_.d("count.total",c,p,0)));_.b("</p>\r");_.b("\n" + i);_.b("	</div>\r");_.b("\n" + i);_.b("</article>\r");_.b("\n");return _.fl();;}, "", hogan);  function render(){ return tmpl.render.apply(tmpl, arguments); } render.template = tmpl; return render;});

define('css!iga/apps/fyre-socialcount/css/disclosure-inyourcity.min.css', ['css-embed'], 
function(embed)
{
	embed(
	'@CHARSET "ISO-8859-1";div#contest-container{background:#000;background:rgba(0,0,0,.5)}h1#headline{background:#fff;color:#000;padding:5px 20px;font-family:"tandelle",sans-serif;font-weight:300;font-size:48px;line-height:1em;margin-bottom:10px}div.iga-socialcount-container>article.university{width:20%;float:left;padding:180px 0 20px;background:#fff;margin:10px;background-size:cover;background-position:center center;background-repeat:no-repeat;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;height:300px}div.iga-socialcount-container>article.disqualified{opacity:.2;width:200px}div.iga-socialcount-container>article.university div.info{background:#000;background:rgba(0,0,0,.8);padding:20px 0 20px 12px;width:100%;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}div.iga-socialcount-container>article.university h3{color:#fff;font-size:36px;letter-spacing:.05em;-webkit-font-smoothing:antialiased;font-weight:300;text-transform:uppercase;line-height:1em;font-family:"tandelle",sans-serif;display:inline-block;margin-bottom:0}div.iga-socialcount-container>article.disqualified h3,div.iga-socialcount-container>article.disqualified p{text-decoration:line-through}div.iga-socialcount-container>article.disqualified p.percentOfTotal{display:none}div.iga-socialcount-container>article.university p{font-size:13px;color:#0cf;-webkit-font-smoothing:antialiased}div.iga-socialcount-container>article.university p.percentOfTotal{padding:2px 10px 2px 5px;background:#0cf;color:#000;font-size:24px;float:right;width:auto;font-weight:300;position:relative;top:-35px;line-height:1em;font-family:"tandelle",sans-serif}div.iga-socialcount-container>article.university .date{display:inline-block;color:#c3c3c3}div.iga-socialcount-container>article.university p.percentOfTotal,div.iga-socialcount-container>article.university p.total{transition:all 2s;-moz-transition:all 2s;-webkit-transition:all 2s}div.iga-socialcount-container>article.university p.percentOfTotal.changed,div.iga-socialcount-container>article.university p.total.changed{color:#fff;font-size:2em}div.iga-socialcount-container>article.university:nth-last-child(-n+6) h3{font-size:24px}div.iga-socialcount-container>article.university:nth-last-child(-n+6) p.percentOfTotal{font-size:16px}div.iga-socialcount-container>article.purdue{background-image:url(http://www.ohlays.com/wallpapers/purdueboilermaker.jpg)}div.iga-socialcount-container>article.ucla{background-image:url(http://www.ohlays.com/wallpapers/uclabruins.jpg)}div.iga-socialcount-container>article.usc{background-image:url(http://www.ohlays.com/wallpapers/usctrojans.jpg)}div.iga-socialcount-container>article.harvard{background-image:url(http://www.ohlays.com/wallpapers/harvardcrimson.jpg)}div.iga-socialcount-container>article.oregon{background-image:url(http://www.ohlays.com/wallpapers/oregonducks.jpg)}div.iga-socialcount-container>article.cal{background-image:url(http://www.ohlays.com/wallpapers/californiagoldenbears.jpg)}div.iga-socialcount-container>article.michigan{background-image:url(http://www.ohlays.com/wallpapers/michiganwolverines.jpg)}div.iga-socialcount-container>article.duke{background-image:url(http://www.ohlays.com/wallpapers/dukebluedevils.jpg)}div.iga-socialcount-container>article.ohio-state{background-image:url(http://www.ohlays.com/wallpapers/ohiostatebuckeyes.jpg)}div.iga-socialcount-container>article.florida{background-image:url(http://www.ohlays.com/wallpapers/floridagators.jpg)}div.iga-socialcount-container>article.arizona{background-image:url(http://www.ohlays.com/wallpapers/arizonawildcats1.jpg)}div.iga-socialcount-container>article.arizona-state{background-image:url(http://www.ohlays.com/wallpapers/arizonastatesundevils.jpg)}div.iga-socialcount-container>article.university.bucket-percentOfTotal-0to9{width:150px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-10to19{width:200px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-20to29{width:300px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-30to39{width:350px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-40to49{width:400px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-50to59{width:450px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-60to69{width:4750px}div.iga-socialcount-container>article.university.bucket-percentOfTotal-70to79,div.iga-socialcount-container>article.university.bucket-percentOfTotal-80to89,div.iga-socialcount-container>article.university.bucket-percentOfTotal-90to99,div.iga-socialcount-container>article.university.bucket-percentOfTotal-100plus{width:500px}'
	);
	return true;
});

/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define('iga/apps/fyre-socialcount/Disclosure-InYourCity',["jquery", "underscore", "IGA.utils",
        "iga/apps/fyre-socialcount/SocialCountCampaignView", 
        "hgn!iga/apps/fyre-socialcount/templates/Disclosure-InYourCity-Item.tpl",
        "css!iga/apps/fyre-socialcount/css/disclosure-inyourcity.min.css",],
		function($, _, utils, SocialCountCampaignView, DisclosureItemTemplate){
	
	var DisclosureCampaign = SocialCountCampaignView.extend({
		initialize: function(options){
			var self = this;
			this.options = options;
			this._itemTemplate = DisclosureItemTemplate;
			SocialCountCampaignView.prototype.initialize.apply(this, [options]);
			//isotope the items to sort onchange
		}
	});
	
	return DisclosureCampaign;
});