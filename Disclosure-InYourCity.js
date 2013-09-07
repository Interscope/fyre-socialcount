/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils",
        "iga/apps/fyre-socialcount/SocialCountCampaignView", 
        "hgn!iga/apps/fyre-socialcount/templates/Disclosure-InYourCity-Item.tpl",
        "css!iga/apps/fyre-socialcount/css/disclosure-inyourcity.css",],
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