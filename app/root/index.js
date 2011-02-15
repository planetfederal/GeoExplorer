var Request = require("ringo/webapp/request").Request;
var Response = require("ringo/webapp/response").Response;
var auth = require("../auth");

exports.app = function(env) {
    var request = new Request(env);
    var details = auth.getDetails(request);
    return Response.skin(module.resolve("../skins/index.html"), {
        status: details.status
    });
};

