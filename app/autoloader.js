// the autoloader injects scripts into the document dynamically
// only suitable for development/debug mode

var {Application} = require("stick");
var FS = require("fs");
var CONFIG = require("buildkit").config;
var MERGE = require("buildkit").merge;

var template = getResource("./templates/debug-loader.js").getContent();

var libLoader = function(section, order) {
    var paths = [];
    order.forEach(function(path) {
        paths.push("'@" + section + "/" + path + "'");
    });
    var body = template.replace("{{paths}}", paths.join(",\n"));
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

var App = function(config) {
    var sections = CONFIG.parse(config);
    var group, root, order, app, urls = {};
    for (var section in sections) {
        group = sections[section];
        // make root relative to config
        root = FS.join(FS.directory(config), group.root[0]);
        group.root = [root];
        order = MERGE.order(group);
        // create lib loader
        urls["/" + section] = libLoader(section, order);
        // create static loader for all scripts in lib
        app = Application();
        app.configure("static");
        app.static(root);
        urls["/@" + section] = app;
    }
    return URLMap(urls);
    
};

exports.App = App;

var URLMap = function(map, options) {
    var options = options || { longestMatchFirst : true },
        mapping = [];
        
    for (var location in map) {
        var app = map[location],
            host = null,
            match;
        
        if (match = location.match(/^https?:\/\/(.*?)(\/.*)/)) {
            host = match[1];
            location = match[2];
        }
            
        if (location.charAt(0) != "/") {
            throw new Error("paths need to start with / (was: " + location + ")");
        }
        
        mapping.push([host, location.replace(/\/+$/,""), app]);
    }
    // if we want to match longest matches first, then sort
    if (options.longestMatchFirst) {
        mapping = mapping.sort(function(a, b) {
            return (b[1].length - a[1].length) || ((b[0]||"").length - (a[0]||"").length);
        });
    }
    
    return function(env) {
        var path = env.pathInfo.replace(/\/+$/,"");
        var hHost = env.host, sPort = env.port;

        for (var i = 0; i < mapping.length; i++) {
            var host = mapping[i][0], location = mapping[i][1], app = mapping[i][2];

            if ((host === hHost || (host === null)) &&
                (location === path.substring(0, location.length)) &&
                (path.charAt(location.length) === "" || path.charAt(location.length) === "/"))
            {
                env = Object.create(env); // make a shallow "copy", since we're modifying SCRIPT_NAME / PATH_INFO

                env.scriptName += location;
                env.pathInfo = path.substring(location.length);

                return app(env);
            }
        }

        throw {notfound: true};
    }
}
