var CONFIG = require("buildkit/config");
var MERGE = require("buildkit/merge");
var FILE = require("file");
var URLMap = require("jack").URLMap;
var File = require("jack").File;
var Static = require("jack").Static;

var notFound = require("./geoexplorer/util").notFound;

var template = '                                                            \n\
(function() {                                                               \n\
                                                                            \n\
    var jsfiles = [@paths@];                                                \n\
                                                                            \n\
    var scripts = document.getElementsByTagName("script");                  \n\
    var parts = scripts[scripts.length-1].src.split("/");                   \n\
    parts.pop();                                                            \n\
    var path = parts.join("/");                                             \n\
                                                                            \n\
    var appendable = !(/MSIE/.test(navigator.userAgent) ||                  \n\
                       /Safari/.test(navigator.userAgent));                 \n\
    var pieces = new Array(jsfiles.length);                                 \n\
                                                                            \n\
    var element = document.getElementsByTagName("head").length ?            \n\
                    document.getElementsByTagName("head")[0] :              \n\
                    document.body;                                          \n\
    var script, src;                                                        \n\
                                                                            \n\
    for(var i=0; i<jsfiles.length; i++) {                                   \n\
        src = path + "/" + jsfiles[i];                                      \n\
        if(!appendable) {                                                   \n\
            pieces[i] = "<script src=\'" + src + "\'></script>";            \n\
        } else {                                                            \n\
            script = document.createElement("script");                      \n\
            script.src = src;                                               \n\
            element.appendChild(script);                                    \n\
        }                                                                   \n\
    }                                                                       \n\
    if(!appendable) {                                                       \n\
        document.write(pieces.join(""));                                    \n\
    }                                                                       \n\
})();                                                                       \n\
';

var libLoader = function(section, order) {
    var paths = [];
    order.forEach(function(path) {
        paths.push("'@" + section + "/" + path + "'");
    });
    var body = template.replace("@paths@", paths.join(",\n"));    
    return function(env) {
        return {
            status: 200,
            headers: {"Content-Type": "text/javascript"},
            body: [body]
        };
    };
};

var scriptLoader = function(root, script) {
    return function(env) {
        var path = FILE.path(FILE.join(root, script));
        var body = path.read({mode: "b"});
        return {
            status : 200,
            headers : {
                "Last-Modified": path.mtime().toUTCString(),
                "Content-Type": "text/javascript",
                "Content-Length": body.length.toString(10)
            },
            body : [body]
        };
    };
};


var App = function(config) {
    
    var sections = CONFIG.parse(config);
    var group, root, order, urls = {};
    for (var section in sections) {
        group = sections[section];
        // make root relative to jackconfig
        root = FILE.join(FILE.dirname(config), group.root[0]);
        group.root = [root];
        order = MERGE.order(group);
        // create lib loader
        urls["/" + section] = libLoader(section, order);
        // create static loader for all scripts in lib
        urls["/@" + section] = Static(notFound, {root: root, urls: [""]}); 
    }
    return URLMap(urls);
    
};

exports.App = App;
