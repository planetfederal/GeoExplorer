var Response = require("ringo/webapp/response").Response;
var Request = require("ringo/webapp/request").Request;
var auth = require("../auth");

exports.app = function(req) {
    var request = new Request(req);
    var details = auth.getDetails(request);
    var response = Response.skin(module.resolve("../skins/composer.html"), {status: details.status});
    return response;
};
