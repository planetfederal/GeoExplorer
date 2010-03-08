
Writing JSGI Applications
=========================

A JSGI application is simply a JavaScript function. It takes a single environment argument, and it should return an array containing three elements: the status code (an integer), the headers values (a hash), and a body object (anything that responds to the "forEach" method which yields objects that have a "toByteString()" method).

Narwhal has extended JavaScript String, ByteArray, and ByteString respond to "toByteString" (so they are valid "body" responses), thus the following is a valid JSGI application:

    function(env) {
        return {
            status : 200,
            headers : {"Content-Type":"text/plain"},
            body : ["Hello world!"]
        };
    }

If you need something more complex with extra state, you can provide a "constructor" in the form of a function:

    MyApp = function(something) {
        return function(env) {
            return {
              status : 200,
              headers : {"Content-Type":"text/plain"},
              body : ["Hello " + this.something + "!"]
            };
        }
    }

    app = MyApp("Fred");

Be careful to ensure your application and middleware is thread-safe if you plan to use a multithreaded server like Jetty and Simple.

The first (and only) argument to the application method is the "environment" object, which contains a number of properties. Many of the standard CGI environment variables are included, as well as some JSGI specific properties which are prefixed with "jsgi.".

The Request and Response objects are part of Jack, not the JSGI specification, but may be helpful in parsing request parameters, and building a valid response. They are used as follows:

    var req = new Jack.Request(env);
    var name = req.GET("name");

    var resp = new Jack.Response();
    resp.setHeader("Content-Type", "text/plain");
    resp.write("hello ");
    resp.write(name);
    resp.write("!");
    return resp.finish();

This is roughly equivalent to returning `{ status : 200, headers : {"Content-Type" : "text/plain"}, body : ["hello "+name+"!"] }`
