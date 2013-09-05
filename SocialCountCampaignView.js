/**
 * @author Malcolm Poindexter <malcolm.poindexter@umusic.com>
 */
define(["jquery", "underscore", "IGA.utils", "hogan", "backbone", "backbone.layoutmanager",
        "iga/apps/fyre-socialcount/SocialCountCollection", 
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaign.tpl.html",
        "hgn!iga/apps/fyre-socialcount/templates/SocialCountCampaignItem.tpl.html",
        /*"hgn!iga/apps/fyre-socialcount/templates/partials.tpl.html"*/],
		function($, _, utils, Hogan, Backbone, LayoutManager, SocialCountCollection, CampaignTemplate, ItemTemplate, PartialTemplates){
	
	Backbone.Layout.configure({ manage: true });
	
	var SocialCountItem = Backbone.Layout.extend({});
	
	var SocialCountCollectionView = Backbone.Layout.extend({
		className: "iga-fyre-socialcount",
		template: (function () {
	        return function (data) {
	            var _template = CampaignTemplate;
	            if(typeof _template == "string"){
	            	_template = Hogan.compile(_template);
	        	}
	            return _template.render(data, PartialTemplates);
	        };
	    }()),
	    itemTemplate: (function () {
	        return function (data) {
	            var _template = ItemTemplate;
	            if(typeof _template == "string"){
	            	_template = Hogan.compile(_template);
	        	}
	            return _template.render(data, PartialTemplates);
	        };
	    }()),
	    render: function() {
	    	var self = this;
	    	var $rendered = this.template(this.serialize());
	    	this.$el.append($rendered);
	    	//Perform any needed jQuery on $el
	    	return this;
	    },
		collection: SocialCountCollection,
		serialize: function(){ return this.collection.serialize(); },
		initialize: function(options){
			this.options = options;
			
			this.collection.on("add", function(){
				//Render the new model
			});
			
			this.collection.on("remove", function(){
				
			});
			
			function _$change($c, value){
				$c.addClass("changed");
				setTimeout(function(){$c.removeClass("changed");}, options.changeAnimationTimeout || 3000);
				$c.text(value);
			}
			
			this.collection.on("change:"+attr, function(model, value, options){
				//update the view for the model
				var $counter = this.$el.find("."+attr+".value");
				_$change($counter, (key.indexOf("percent") === 0)?IGA.utils.round(value, this.settings.decimalPlaces || 2):value);
				if(key === "percentOfTotal"){
					this.$el.find(".percent-of-total").css({width:value+"%"});
				}else if(key === "percentOfGoal"){
					this.$el.find(".percent-of-goal").css({width:value+"%"});
				}else if(key === "percentToGoal"){
					this.$el.find(".percent-to-goal").css({width:value+"%"});
				}
			}, this);
			
			return this;
		},
		start: function(){
			//Update & poll the collection
			return this;
		}
	});
	
	return SocialCountCollectionView;
});