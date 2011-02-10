var Client = require("ringo/httpclient").Client;

function getAuthUrl(request) {
    return request.scheme + "://" + request.host + (request.port ? ":" + request.port : "") + "/geoserver/rest";
}

var checkAuthStatus = exports.checkStatus = function(request) {
    var url = getAuthUrl(request);
    var client = new Client();
    var exchange = client.request({
        url: url,
        method: "GET",
        headers: request.headers,
        async: false
    });
    exchange.wait();
    return exchange.status;
};

