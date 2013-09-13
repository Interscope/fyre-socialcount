/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API
 */
define(["jquery", "underscore", "IGA.utils", "backbone", "iga/apps/fyre-socialcount/models/BaseCount"],
		function($, _, utils, Backbone, BaseCountModel){
	
	var ContentCount = BaseCountModel.extend({});
	
	ContentCount.FORMAT = "{{siteId}}:{{articleId}}";
	ContentCount.SEP = ",";
	ContentCount.API = 'http://bootstrap.{{network}}/api/v1.1/public/comments/ncomments/{{query}}.json';
	ContentCount.sampleResponse = function(callback){ require(["text!iga/apps/fyre-socialcount/models/content-count-sample.json", "json2"], function(data, JSON){
		return callback(JSON.parse(data));
	} ); };
	
	return ContentCount;
});