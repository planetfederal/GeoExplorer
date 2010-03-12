var Request = require("./request").Request;

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
exports.MethodOverride = function(app) {
    return function(env) {
        if (env["REQUEST_METHOD"] == "POST") {
            var request = new Request(env),
                method = env[HTTP_METHOD_OVERRIDE_HEADER] || request.POST(METHOD_OVERRIDE_PARAM_KEY);
            if (method && HTTP_METHODS[method.toUpperCase()] === true) {
                env["jack.methodoverride.original_method"] = env["REQUEST_METHOD"];
                env["REQUEST_METHOD"] = method.toUpperCase();
            }
        }
        return app(env);
    }
}

var HTTP_METHODS = {"GET":true, "HEAD":true, "PUT":true, "POST":true, "DELETE":true, "OPTIONS":true};
var METHOD_OVERRIDE_PARAM_KEY = "_method";
var HTTP_METHOD_OVERRIDE_HEADER = "HTTP_X_HTTP_METHOD_OVERRIDE";
