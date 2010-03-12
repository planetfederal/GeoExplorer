var ShowExceptions = exports.ShowExceptions = function(app) {
    return function(env) {
        try {
            return app(env);
        } catch (e) {
            var backtrace = "<html><body><pre>" + e.name + ": " + e.message;
            if (e.rhinoException) {
                backtrace += "\n" + e.rhinoException.getScriptStackTrace();
            }
            backtrace += "</body></html>";
            return {
                status : 500,
                headers : {"Content-Type":"text/html","Content-Length":String(backtrace.length)},
                body : [backtrace]
            };
        }
    }
}
