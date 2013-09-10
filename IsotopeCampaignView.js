/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "isotope", 
        "isotope/jquery.isotope-addSortLayoutShow",
        "iga/apps/fyre-socialcount/SocialCountCampaignView", 
        "css!jquery-plugins/jquery.isotope.css"],
		function($, _, utils, isotope, _aSLS, SocialCountCampaignView){
	
	function _sort(sortAttr){ return function( $item ) {
	    	var model = $item.data("model"), _mv, value = -1;
	    	if(model){
	    		_mv = model.get(sortAttr);
	    		if(typeof _mv !== "undefined"){value = _mv; }
	    	}
	        return value;
    	};
    }
	
	var IsotopeCampaignView = SocialCountCampaignView.extend({
		initialize: function(options){
			var self = this;
			this.options = options;
			SocialCountCampaignView.prototype.initialize.apply(this, [options]);
			
			//isotope the items to sort onchange
			options.isotope = $.extend(true, {
				itemSelector: '.iga-socialcount-container > article',
				getSortData : {
	                "count.total" : _sort("count.total")
	            },
	            sortBy: "count.total",
	            sortAscending: false,
	            animationOptions: {duration: 600, easing: "linear", queue: false },
	            animationEngine: $.browser.mozilla || $.browser.msie ? "jquery" : "best-available"
			}, options.isotope);
			
			if(options.isotope.sortOptions){
				_.each(options.isotope.sortOptions.split(","), function(sortBy){
					sortBy = sortBy.trim();
					options.isotope.getSortData[sortBy] = _sort(sortBy);
				});
			}
			
			this.on("render", function(){
				this.$container.isotope(options.isotope);
			});
			
			this.collection.on("add",function(model){
				self.$container.isotope("addSortLayoutShow", self.$items[model.id]);
				//self.$container.isotope("addItems", self.$items[model.id]).isotope({sortBy:options.isotope.sortBy});
				//self.$container.isotope("reLayout");
			});
			
			this.collection.on("remove",function(model){
				self.$container.isotope("remove", self.$items[model.id]).isotope("reLayout");
			});

			this.collection.on("change",function(model){
				self.$container.isotope("reLayout");
			});
			
		}
	});
	
	return IsotopeCampaignView;
});