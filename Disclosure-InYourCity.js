/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "isotope", "isotope/jquery.isotope-addSortLayoutShow",
        "iga/apps/fyre-socialcount/IsotopeCampaignView", 
        "hgn!iga/apps/fyre-socialcount/templates/Disclosure-InYourCity-Item.tpl",
        "css!iga/apps/fyre-socialcount/css/disclosure-inyourcity.css",],
		function($, _, utils, isotope, _aSLS, IsotopeCampaignView, DisclosureItemTemplate){
	
	var DisclosureCampaign = IsotopeCampaignView.extend({
		initialize: function(options){
			var self = this;
			this.options = options;
			this._itemTemplate = DisclosureItemTemplate;
			
			//isotope the items to sort onchange
			options.isotope = $.extend(true, {
				layoutMode: 'masonry',
				masonry:{ columnWidth:25 },
				itemSelector: '.iga-socialcount-container > article',
	            sortBy : "count.total"
			}, options.isotope);
			
			IsotopeCampaignView.prototype.initialize.apply(this, [options]);
			
		}
	});
	
	return DisclosureCampaign;
});