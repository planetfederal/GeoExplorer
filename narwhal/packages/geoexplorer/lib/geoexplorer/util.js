
var responseForStatus = require("jack/utils").responseForStatus;

var notFound = function(env) {
    return responseForStatus(404);
};

exports.notFound = notFound;
