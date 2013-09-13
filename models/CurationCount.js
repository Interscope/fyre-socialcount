/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Curation-Count-API-%28DRAFT%29
 */
define(["jquery", "underscore", "IGA.utils", "backbone", "iga/apps/fyre-socialcount/models/BaseCount"],
		function($, _, utils, Backbone, BaseCountModel){
	
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