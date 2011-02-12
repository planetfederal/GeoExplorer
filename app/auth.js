var Client = require("ringo/httpclient").Client;

function getAuthUrl(request) {
    var url = java.lang.System.getProperty("app.proxy.geoserver");
    if (url) {
        if (url.charAt(url.length-1) !== "/") {
            url = url + "/";
        }
    } else {
        url = request.scheme + "://" + request.host + (request.port ? ":" + request.port : "") + "/geoserver/";
    }
    return url + "j_spring_security_check";
}

var checkStatus = exports.checkStatus = function(request) {
    return requestAuthorization(request).status;
};

var requestAuthorization = exports.requestAuthorization = function(request) {
    var url = getAuthUrl(request);
    var client = new Client();
    var exchange = client.request({
        url: url,
        method: "GET",
        headers: request.headers,
        async: false
    });
    exchange.wait();
    return exchange;
};
