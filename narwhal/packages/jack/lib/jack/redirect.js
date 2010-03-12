var url = require("url");

exports.Redirect = function (path, status) {
    
    status = status || 301;
    
    return function (env) {
        var location = 
            (env["jsgi.url_scheme"] || "http") +
            "://" + 
            (env.HTTP_HOST || (
                env.SERVER_NAME +
                (env.SERVER_PORT == "80" ? "" : ":" + env.SERVER_PORT)
            )) +
            (env.SCRIPT_NAME || "") +
            env.PATH_INFO;

        location = path ? url.resolve(location, path) : env.HTTP_REFERER;

        return {
            status : status,
            headers : {
                "Location": location,
                "Content-type": "text/plain"
            },
            body : ['Go to <a href="' + location + '">' + location + "</a>"]
        };
    };
};

