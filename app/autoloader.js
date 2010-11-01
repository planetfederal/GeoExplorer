

var FS = require("fs");
var URLMap = require("util").URLMap;
var STATIC = require("ringo/middleware/static").middleware;

// TODO: unhack this
var path = FS.normal(FS.join(module.directory, "..", "externals", "buildkit", "lib"));
require.paths.push(path);
var CONFIG = require("buildkit/config");
var MERGE = require("buildkit/merge");


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
        var path = FS.join(root, script);
        var body = FS.read(path);
        return {
            status : 200,
            headers : {
                "Last-Modified": FS.lastModified(path).toUTCString(),
                "Content-Type": "text/javascript",
                "Content-Length": body.length.toString(10)
            },
            body : [body]
        };
    };
};


var notFound = function() {
    throw {notfound: true};
};

var App = function(config) {
    
    var sections = CONFIG.parse(config);
    var group, root, order, urls = {};
    for (var section in sections) {
        group = sections[section];
        // make root relative to config
        root = FS.join(FS.directory(config), group.root[0]);
        group.root = [root];
        order = MERGE.order(group);
        // create lib loader
        urls["/" + section] = libLoader(section, order);
        // create static loader for all scripts in lib
        var app = STATIC(root)(notFound);
        urls["/@" + section] = app; 
    }
    return URLMap(urls);
    
};

exports.App = App;
