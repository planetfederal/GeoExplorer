
Getting Started With Jack
=========================

Jack currently supports the [Jetty](http://www.mortbay.org/jetty/) (and other servlet containers) and [Simple](http://www.simpleframework.org/) webservers using [Rhino](http://www.mozilla.org/rhino/). It's also easy to add support for other webservers.

The current Jack implementation uses Narwhal for support. Narwhal is a JavaScript standard library (based on the ServerJS standard: [https://wiki.mozilla.org/ServerJS](https://wiki.mozilla.org/ServerJS)) and is located at [http://narwhaljs.org/](http://narwhaljs.org/)

To start working with Jack, follow the [Narwhal Quick Start](http://narwhaljs.org/quick-start.html) guide, which includes installing Jack.

Then run one of the examples (paths relative to Narwhal installation):

    jackup packages/jack/example/example.js
    jackup packages/jack/example/comet.js
    
Or if the current directory contains "jackconfig.js" you can just run "jackup"

    jackup

This is equivalent to:

    jackup jackconfig.js

A Jackup configuration file is a normal Narwhal module that exports a function called "app":

    exports.app = function(env) {
        return {
            status : 200,
            headers : {"Content-Type":"text/plain"},
            body : ["Hello world!"]
        };
    }
    
If the module also exports a function with the same name as the chosen environment (using the "-E" command line option, "development" by default) that function will be used to apply middleware to your application. This allows you to define custom sets of middleware for different environments. For example:

    exports.development = function(app) {
        return Jack.CommonLogger(
            Jack.ShowExceptions(
              Jack.Lint(
                Jack.ContentLength(app))));
    }

To see other options of Jackup, use the "-h" option:

    jackup -h
