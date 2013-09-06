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
				
			}
			
			//Add some view-layer attributes
			attributes.cssSafeId = attributes.id.replace("_","-").replace(/[#\.]/g, '');
			this.set(attributes, {silent:true});
		}
	});
	
	return BaseCount;
});