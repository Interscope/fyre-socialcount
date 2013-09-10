#!/bin/bash
#require node, uglifyjs, csso, rjs, gzip
_PATH=$(echo $PWD | sed -e 's/.*js\/\(.*\)/\1/' | xargs echo)
if [ -z "$1" ]; then
	echo -e "\e[1;31mA file to build is required.\e[0m"
	exit;
fi
_BUILD_FILE=$1
#Minify & Run Replacements on css
cd css
rm *.min.css -f
echo -e "\e[1;37mOptimizing css files \e[0m"
echo -e "\e[1;37m\tCreating Minified copies of css\e[0m"
ls *.css | sed -e 's/\.css//g' | xargs -n 1 -i\x  csso \x.css \x.min.css
ls *.min.css | xargs -n 1 -i\x sed -i -r s:"'(images\S*)'":'"\1"':g \x
ls *.min.css | xargs -n 1 -i\x sed -i -r s:"[(](images\S*)[)]":'("\1")':g \x
echo -e "\e[1;37m\tSwitching image paths to CDN\e[0m"
ls *.min.css | xargs -n 1 -i\x sed -i -r s:'"images/(\S*\.(gif|jpg|png))':"\"//cache.umusic.com/web_assets/_global/js/$_PATH/css/images/\1":g \x
cd ../templates

# Create CDN Compatible templates html.js modules
echo -e "\e[1;37mCreating Mustache html.js templates and partials for CDN deployment \e[0m"
ls *.html | xargs -n 1 -i\x cp \x \x.js
ls *.html | xargs -n 1 -i\x sed -i ':a;N;$!ba;s/\n/ /g' \x.js
ls *.html | xargs -n 1 -i\x sed -i -r s:"'":"\\\\'":g \x.js
ls *.tpl.html | sed -e 's/\.tpl\.html//g' | xargs -n 1 -i\x sed -i -r s:"(.*)":"define([],function(){ return '\1';});":g \x.tpl.html.js

echo -e "\e[1;37m\tCreating Partials Template Mustache html.js templates and partials for CDN deployment \e[0m"
ls *.part.html | xargs -n 1 -i\x cp \x.js \x.tmp.js
ls *.part.html | sed -e 's/\.part\.html//g' | xargs -n 1 -i\x  sed -i -r s:"(.*)":"partials['\x']='\1'; ":g \x.part.html.tmp.js
echo -e "\e[1;37m\tCombining .part.tpl.html templates  into partials.html.js Module \e[0m"
ls *.part.html.tmp.js | xargs -i\x cat \x > partials.html.js
rm *.part.html.tmp.js
sed -i -r s:"(.*)":"define([],function(){ var partials = {}; \1 return partials;});":g partials.html.js

ls *.part.html | sed -e 's/\.part\.html//g' | xargs -n 1 -i\x sed -i -r s:"(.*)":"define([],function(){ return '\1';});":g \x.part.html.js
cd ..

#Build and rjs optimize module .js
echo -e "\e[1;37mOptimizing $_BUILD_FILE.js ... \e[0m"
cp $_BUILD_FILE.js $_BUILD_FILE.tmp.js
#echo -e "\e[1;37m\tSwitching to minified css \e[0m"
#sed -i -r s:"(['\"]css!.*)\.css(['\"])":"\1.min.css\2":g $_BUILD_FILE.tmp.js
echo -e "\e[1;37m\tRunning requirejs optimizer > $_BUILD_FILE.opt.js  \e[0m"
rjs -o app.build.js name=$_PATH/$_BUILD_FILE.tmp out=$_BUILD_FILE.opt.js
sed -i -r s:"$_BUILD_FILE\.tmp":"$_BUILD_FILE":g $_BUILD_FILE.opt.js
echo -e "\e[1;37mMinifying Module > $_BUILD_FILE.opt.min.js\e[0m"
uglifyjs $_BUILD_FILE.opt.js > $_BUILD_FILE.opt.min.js
echo -e "\e[1;37mGzipping Module > $_BUILD_FILE.opt.min.js.gz (Not needed for Akamai Deployments) \e[0m"
gzip -c $_BUILD_FILE.opt.min.js > $_BUILD_FILE.opt.min.js.gz
rm $_BUILD_FILE.tmp.js -f
echo -e "\e[1;37mDONE\e[0m"
