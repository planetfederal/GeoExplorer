
var urls = [
    [(/^\/proxy/), require("./proxy").app],
    [(/^\/maps(\/\d+)?/), require("./maps").app]
    // TODO: remove after http://github.com/ringo/ringojs/issues#issue/97 is closed
    ,["/", function(env) {
        throw {redirect: "index.html"};
    }]
];

// debug mode loads unminified scripts
if (java.lang.System.getProperty("GEOEXPLORER_DEBUG")) {
    var FS = require("fs");
    var config = FS.normal(FS.join(module.directory, "..", "buildjs.cfg"));
    urls.push(
        [(/^\/script(\/.*)/), require("./autoloader").App(config)]
    );    
} else {
    print("production mode");
}

exports.urls = urls;

// TODO: remove if http://github.com/ringo/ringojs/issues/issue/98 is addressed
function slash(config) {
    return function(app) {
        return function(request) {
            var response;
            var servletRequest = request.env.servletRequest;
            var pathInfo = servletRequest.getPathInfo();
            if (pathInfo === "/") {
                var uri = servletRequest.getRequestURI();
                if (uri.charAt(uri.length-1) !== "/") {
                    var location = servletRequest.getScheme() + "://" + 
                        servletRequest.getServerName() + ":" + servletRequest.getServerPort() + 
                        uri + "/";
                    return {
                        status: 301,
                        headers: {"Location": location},
                        body: []
                    };
                }
            }
            return app(request);
        }
    }
}

exports.middleware = [
    slash(),
    require("ringo/middleware/gzip").middleware,
    // TODO: add index option after http://github.com/ringo/ringojs/issues#issue/97 is closed
    require("ringo/middleware/static").middleware(module.resolve("static")),
    require("ringo/middleware/error").middleware,
    require("ringo/middleware/notfound").middleware
];

exports.app = require("ringo/webapp").handleRequest;

exports.charset = "UTF-8";
exports.contentType = "text/html";
