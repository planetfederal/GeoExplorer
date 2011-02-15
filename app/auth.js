var Client = require("ringo/httpclient").Client;
var Headers = require("ringo/utils/http").Headers;

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
    var token;  // TODO: get token from request cookie
    var status; 
    var url = getAuthUrl(request);
    var client = new Client(undefined, false);
    var exchange = client.request({
        url: url,
        method: "GET",
        async: false,
        headers: request.headers
    });
    exchange.wait();
    var cookie = exchange.headers.get("Set-Cookie");
    if (cookie) {
        token = cookie.split(";").shift();
        status = 401;
    } else {
        status = 404;
    }
    return {status: status, token: token, url: url};
};

