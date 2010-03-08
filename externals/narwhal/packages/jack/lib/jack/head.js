var Head = exports.Head = function(app) {
    return function(env) {
        var response = app(env);

        if (env["REQUEST_METHOD"] === "HEAD")
            response.body = [];
            
        return response;
    }
}
