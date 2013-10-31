/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "isotope", "isotope/jquery.isotope-addSortLayoutShow",
        "iga/apps/fyre-socialcount/IsotopeCampaignView",
        "hgn!iga/apps/fyre-socialcount/templates/Lyrics-SocialCount-Item.tpl"],
		function($, _, utils, isotope, _aSLS, IsotopeCampaignView, ItemTemplate){
	
	var LyricsSocialVote = IsotopeCampaignView.extend({
		initialize: function(options){
			var self = this;
			this.options = options;
			this._itemTemplate = ItemTemplate;
			
			//isotope the items to sort onchange
			options.isotope = $.extend(true, { }, options.isotope);
			
			IsotopeCampaignView.prototype.initialize.apply(this, [options]);
			
			this.once("loaded", function(){
				if(typeof twttr != "undefined" && typeof twttr.events != "undefined" ){//track twitter vote clicks & successful tweets
					twttr.events.bind('click', function(event) { 
						var $tgt = $(event.target);
						if(!!event && $tgt.is(".iga-socialcount-container a.hashtag") && (typeof _gaq != "undefined")){
							_gaq.push(['_trackEvent', 'LyricsSocialVote', 'twitter.click', $tgt.data("hashtag") ]);
						}
				    });
					twttr.events.bind('tweet', function(event) {
						var $tgt = $(event.target);
						if(!!event && $tgt.is(".iga-socialcountcontainer a.hashtag") && (typeof _gaq != "undefined")){
							_gaq.push(['_trackEvent', 'LyricsSocialVote', 'twitter.tweet', $tgt.data("hashtag")]);
						}
				    });
				}
				
				self.$el.one("mouseenter", function(){ // Track first interaction hover
					if(typeof _gaq != "undefined"){ _gaq.push(['_trackEvent', 'LyricsSocialVote', 'first-interaction']); }//track hovers over the app.
				});
			});
			
		}
	});
	
	return LyricsSocialVote;
});