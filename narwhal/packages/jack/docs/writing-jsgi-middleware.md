
Writing Jack Middleware
=======================

Jack middleware performs pre or post processing on requests and responses, such as logging, authentication, etc. Most Jack middleware, by convention, is a function that takes in one argument, "app" (a Jack application, possibly wrapped in other middleware) and returns another Jack application (i.e. another function that takes in an "env" argument and returns a three element array). The returned Jack application will typically optionally do some preprocessing on the request, followed by calling the "app" that was provided, optionally followed by some post processing.

For example, the "Head" middleware calls the original "app", then checks to see if the request HTTP method was "HEAD". If so, it clears the body of response before returning it, since HEAD requests shouldn't have a response body:

    function Head(app) {
        return function(env) {
            var result = app(env);
            if (env["REQUEST_METHOD"] === "HEAD")
                result.body = [];
            return result;
        }
    }

This style of middleware makes use of a closure to store a reference to the original app.

A more complicated middleware might need to perform post-processing on the body contents. A common pattern is to call the app, then store the body as a property of a "context" and return the context itself in place of the body. The context defines a "forEach" method on the context, which proxies to the stored body property.

It is important to proxy the response body rather than buffer the entire response when dealing with streaming applications, otherwise the middleware will prevent the app from streaming. A good example of this pattern is the CommonLogger middleware, which does this in order to calculate the body length for logging.
