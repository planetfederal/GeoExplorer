#!/usr/bin/env ringo

// main script to start application

if (require.main == module) {
    // TODO: accept args
    java.lang.System.setProperty("app.debug", 1);
    require("ringo/webapp").main(module.directory);
}
