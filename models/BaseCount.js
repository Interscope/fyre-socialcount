/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 * @desc 
 * @see https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API
 */
define(["jquery", "underscore", "IGA.utils", "backbone", "backbone.nestedmodel"],
		function($, _, utils, Backbone, NestedModel){
	
	var BaseCount = Backbone.NestedModel.extend({
		defaults:{
			count:{
				percentOfTotal: 0
			}
		},
		initialize: function(attributes, options){
			this.config = options;
			if(attributes.goal){
				this.set({"percentToGoal": 0, "percentOfGoal": 0 });
				this.on("change:count.total", function(model, value, options){
						var _p = value / this.get("goal") * 100;
						model.set("percentOfGoal", _p);
						model.set("percentToGoal", Math.min(100, _p));
				}, this);
			}
		}
	});
	
	return BaseCount;
});