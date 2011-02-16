var Client = require("ringo/httpclient").Client;
var Headers = require("ringo/utils/http").Headers;
var objects = require("ringo/utils/objects");

function getAuthUrl(request) {
    var url = java.lang.System.getProperty("app.proxy.geoserver");
    if (url) {
        if (url.charAt(url.length-1) !== "/") {
            url = url + "/";
        }
    } else {
        url = request.scheme + "://" + request.host + (request.port ? ":" + request.port : "") + "/geoserver/";
    }
    return url + "rest";
}

var getDetails = exports.getDetails = function(request) {
    var url = getAuthUrl(request);
    var status = 401;
    var headers = new Headers(objects.clone(request.headers));
    var client = new Client(undefined, false);
    var token = headers.get("Cookie");
    var exchange;
    if (token) {
        // already have a cookie, check if authorized
        exchange = client.request({
            url: url,
            method: "GET",
            async: false,
            headers: headers
        });
        exchange.wait();
        status = exchange.status;
    } else {
        // no cookie, first get one (without Authorization header)
        var auth = headers.get("Authorization");
        if (auth) {
            headers.unset("Authorization");
        }
        exchange = client.request({
            url: url,
            method: "GET",
            async: false,
            headers: headers
        });
        exchange.wait();
        var cookie = exchange.headers.get("Set-Cookie");
        if (cookie) {
            token = cookie.split(";").shift();
        } else {
            status = 404;
        }
        // finally, if we got a cookie and we had auth header, check if authorized
        if (cookie && auth) {
            headers.set("Authorization", auth);
            exchange = client.request({
                url: url,
                method: "GET",
                async: false,
                headers: headers
            });
            exchange.wait();
            status = exchange.status;
        }
    }
    return {
        status: status, 
        token: token, 
        url: url
    };
};

