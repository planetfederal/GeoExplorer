/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

exports.testAuthAbstract = require("./auth-abstract-tests");
exports.testAuthBasic = require("./auth-basic-tests");
exports.testAuthDigest = require("./auth-digest-tests");