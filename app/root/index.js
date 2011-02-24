var Request = require("ringo/webapp/request").Request;
var Response = require("ringo/webapp/response").Response;
//var auth = require("../auth");

var nixed = function(env) {
    var request = new Request(env);
    var details = auth.getDetails(request);
    return Response.skin(module.resolve("../skins/index.html"), {
        status: details.status
    });
};

exports.app = function(env) {
    var request = new Request(env);
    var parts = request.path.split("/");
    parts.pop();
    parts.push("composer");
    print(request.scheme + "://" + request.host + ":" + request.port + parts.join("/"));
    return {
        status: 302,
        headers: {"Location": request.scheme + "://" + request.host + ":" + request.port + parts.join("/")},
        body: []
    };
}
