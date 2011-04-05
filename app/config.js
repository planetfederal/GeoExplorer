var Response = require("ringo/webapp/response").Response;
var Request = require("ringo/webapp/request").Request;

var urls = [
    [(/^\/(index(.html)?)?/), require("./root/index").app],
    [(/^\/(login)/), require("./root/login").app],
    [(/^\/(proxy)/), require("./root/proxy").app],
    [(/^\/(maps(\/\d+)?)/), require("./root/maps").app],
    [(/^\/(composer)/), require("./root/composer").app],
    [(/^\/(viewer(.html)?)/), require("./root/viewer").app]
];

// debug mode loads unminified scripts
if (java.lang.System.getProperty("app.debug")) {
    var FS = require("fs");
    var config = FS.normal(FS.join(module.directory, "..", "buildjs.cfg"));
    urls.push(
        [(/^\/script(\/.*)/), require("./autoloader").App(config)]
    );

    // proxy a remote geoserver on /geoserver by setting proxy.geoserver to remote URL
    // only recommended for debug mode
    var geoserver = java.lang.System.getProperty("app.proxy.geoserver");
    if (geoserver) {
        if (geoserver.charAt(geoserver.length-1) !== "/") {
            geoserver = geoserver + "/";
        }
        // debug specific proxy
        urls.push(
            [(/^\/geoserver\/(.*)/), require("./root/proxy").pass({
                url: geoserver, 
                allowAuth: true, 
                /**
                 * Setting preserveHost to true makes it so GeoServer advertises
                 * URLs on the same origin as this app.  That makes it so the
                 * proxy is not involved in any requests issued to this same
                 * GeoServer.  The reason this is required is because we want
                 * to preserve auth related headers in requests to GeoServer and
                 * we don't want to send those same auth related headers to
                 * every service that is proxied.  The negative side effect is
                 * that the proxy will occasionally fail due to 
                 * java.lang.OutOfMemoryError issues.
                 * TODO: figure out why so much memory is being consumed in proxy
                 */
                preserveHost: true
            })]
        );
    }
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
        };
    };
}

exports.middleware = [
    slash(),
    require("ringo/middleware/gzip").middleware,
    require("ringo/middleware/static").middleware({base: module.resolve("static")}),
    require("ringo/middleware/error").middleware,
    require("ringo/middleware/notfound").middleware
];

exports.app = require("ringo/webapp").handleRequest;

exports.charset = "UTF-8";
exports.contentType = "text/html";
