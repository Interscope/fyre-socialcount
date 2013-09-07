/**
 * 
 * @requires node, requirejs, uglifyjs, csso
 * @see http://requirejs.org/docs/optimization.html#onejs
 * @see https://github.com/jrburke/r.js/blob/master/build/example.build.js
 */
({
	/*name: "iga/apps/fyre-socialcount/SocialCountCampaignView.tmp",
	out: "SocialCountCampaignView.opt.js",*/
	baseUrl:"../../../",
	mainConfigFile: '../../iga.require.js',
	paths:{
		"css-build":"lib/requirejs-css-plugin/css-build"
	},
	exclude: ["jquery", "underscore", "backbone", "hogan", "hgn", "text", "IGA.utils"],
	fileExclusionRegExp: /iga\//,
	optimize: "none",
	/*optimize: "uglify",*/
	optimizeCss: "standard",
	inlineText: true,
	/*generateSourceMaps: true,*/
	preserveLicenseComments: true
})