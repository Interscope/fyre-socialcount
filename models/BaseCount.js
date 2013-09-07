/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API
 */
define(["jquery", "underscore", "IGA.utils", "backbone", "backbone.nestedmodel"],
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
						return utils.round(p[0],parseInt(p[1]));
						//return p[0].toFixed(parseInt(p[1]));//imprecise rounding
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