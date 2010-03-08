var jack = require("jack");

var app = function(env) {
    return {
        status : 200,
        headers : { "Content-Type" : "text/html" },
        body : "hello world!"
    };
}

app = jack.Lint(app);

require("jack/handler/v8cgi").run(app, request, response);
