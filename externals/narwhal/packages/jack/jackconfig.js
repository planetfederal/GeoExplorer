#!/usr/bin/env jackup

// the "app" export is the default property used by jackup:
exports.app = function(env) {
    return {
        status : 200,
        headers : {"Content-Type":"text/plain"},
        body : ["jackconfig.js is the default file jackup looks for!"]
    };
}

// specify custom sets of middleware and initialization routines
// by defining a function with the same name as the environment:
exports.development = function(app) {
    return require("jack/commonlogger").CommonLogger(
        require("jack/showexceptions").ShowExceptions(
            require("jack/lint").Lint(
                require("jack/contentlength").ContentLength(app))));
}
