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
	onBuildRead: function (moduleName, path, contents) {
        var _cssR = /(['"]css![\w-\/\.]+)(\.css)(['"])/gi,
        	_css = _cssR.exec(contents);
        if(_css && _css.length === 4){
        	_css[2] = ".min.css";
        	contents = contents.replace(_css[0], _css[1]+_css[2]+_css[3]);
        }
        
        return contents;
    },
    onBuildWrite: function (moduleName, path, contents) {
    	if(path.indexOf("hgn!") >= 0){
	    	var _hgnR = /(new hogan\.Template\(.*)(, hogan)(\))/gi,
	    		_hgn = _hgnR.exec(contents);
	    	if(_hgn && _hgn.length === 4){
		    	_hgn[2] = ", hogan, {}";//we need to pass some options to Hogan.
		    	contents = contents.replace(_hgn[0], _hgn[1]+_hgn[2]+_hgn[3]);
		    }
	    }
	    return contents;
    },
	optimize: "none",
	/*optimize: "uglify",*/
	optimizeCss: "standard",
	inlineText: true,
	/*generateSourceMaps: true,*/
	preserveLicenseComments: true
})