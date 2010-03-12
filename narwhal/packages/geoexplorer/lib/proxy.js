var HttpClient = require("http-client").HttpClient;
var Request = require("jack").Request;
var responseForStatus = require("jack/utils").responseForStatus;

var app = function(env) {
    
    var resp;
    var request = new Request(env);
    var url = request.GET("url");
    if (url) {
        var client = new HttpClient({
            url: url,
            method: env["REQUEST_METHOD"]
            // TODO: headers
        });
        var body = request.body();
        if (body && body.forEach) {
            client.setOption("body", body);
        }
        resp = HttpClient.decode(client.connect());
    } else {
        resp = responseForStatus(400);
    }
    
    return resp;

};

exports.app = app;