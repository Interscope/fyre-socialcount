/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "isotope", 
        "isotope/jquery.isotope-addSortLayoutShow",
        "iga/apps/fyre-socialcount/SocialCountCampaignView", 
        "css!iga/apps/fyre-socialcount/css/isotope-view.css"],
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
				masonry:{ columnWidth:100 },
				itemSelector: '.iga-socialcount-container > article',
	            sortBy: this.collection.options.sortBy,
	            getSortData:{},
	            sortAscending: false,
	            animationOptions: {duration: 600, easing: "linear", queue: false },
	            animationEngine: $.browser.mozilla || $.browser.msie ? "jquery" : "best-available"
			}, options.isotope);
			
			options.isotope.getSortData[this.collection.options.sortBy] = _sort(this.collection.options.sortBy);
			
			if(options.isotope.sortOptions){//add sorters for every sort option.
				_.each(options.isotope.sortOptions.split(","), function(sortBy){
					sortBy = sortBy.trim();
					options.isotope.getSortData[sortBy] = _sort(sortBy);
				});
			}
			
			this.on("render", function(){
				this.$container.isotope(options.isotope);
			});
		
			this.on("renderModel", function($item, model){
				self.$container.isotope("addSortLayoutShow", $item);
				//self.$container.isotope("addItems", self.$items[model.id]).isotope({sortBy:options.isotope.sortBy});
				//self.$container.isotope("reLayout");
				self.reLayout();
			});
			
			this.collection.on("remove",function(model){
				self.$container.isotope("remove", self.$items[model.id]).isotope("reLayout");
			});
			
			var _reLayoutTimer;
			this.once("loaded", function(){
				self.collection.on("change",function(model){
					self.reLayout();
				});
			});
						
		},
		_reLayoutTimer: null,
		reLayout: function(){
			var self = this;
			clearTimeout(this._reLayoutTimer);
			setTimeout(function(){ self.$container.isotope("reLayout"); }, 50);
		}
	
	});
	
	return IsotopeCampaignView;
});