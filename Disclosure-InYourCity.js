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
			
			this.once("loaded", function(){
				if(typeof twttr != "undefined" && typeof twttr.events != "undefined" ){
					twttr.events.bind('click', function(event) { // Track first interaction click
						var $tgt = $(event.target);
						if(!!event && $tgt.is(".iga-socialcount-container a.hashtag")){
							_gaq.push(['_trackEvent', 'DisclosureHouseParty', 'twitter.click', $tgt.data("hashtag") ]);
						}
				    });
					twttr.events.bind('tweet', function(event) {
						var $tgt = $(event.target);
						if(!!event && $tgt.is(".iga-socialcountcontainer a.hashtag")){
							_gaq.push(['_trackEvent', 'DisclosureHouseParty', 'twitter.tweet', $tgt.data("hashtag")]);
						}
				    });					
					
				}
			});
			
		}
	});
	
	return DisclosureCampaign;
});