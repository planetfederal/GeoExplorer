var Request = require("ringo/webapp/request").Request;
var Client = require("ringo/httpclient").Client;
var base64 = require("ringo/base64");
var auth = require("../auth");
var Headers = require("ringo/utils/http").Headers;
var objects = require("ringo/utils/objects");

exports.app = function(req) {
    var request = new Request(req);
    var details = auth.getDetails(request);
    var status = details.status;
    if (status === 401) {
        var params = request.postParams;
        var headers = new Headers(objects.clone(request.headers));
        headers.set("Authorization", "Basic " + base64.encode(params.username + ":" + params.password));
        headers.set("Cookie", details.token);
        var client = new Client(undefined, false);
        var exchange = client.request({
            url: details.url,
            method: "GET",
            async: false,
            headers: headers
        });
        exchange.wait();
        status = exchange.status;
    }
    var cookie;
    if (status === 200) {
        cookie = details.token;
    } else {
        // clear any previously set cookie
        cookie = "JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    return {
        status: status,
        headers: {
            "Set-Cookie": cookie + ";Path=/"
        },
        body: []
    };
};
