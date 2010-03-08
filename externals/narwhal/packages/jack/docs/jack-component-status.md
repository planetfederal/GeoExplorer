
Jack Component Status
=====================

The following components essentially match those in Rack.

### Handlers

* Servlet: complete, for use with Jetty on Rhino, or [other servlet container](http://github.com/tlrobinson/jack-servlet/) such as Google AppEngine for Java.
* Jetty: complete, simple wrapper for Jetty using Servlet handler ([http://www.mortbay.org/jetty/](http://www.mortbay.org/jetty/))
* Simple: complete, for use with the Simple webserver ([http://www.simpleframework.org/](http://www.simpleframework.org/))
* K7: incomplete, for use with the k7 project ([http://github.com/sebastien/k7/](http://github.com/sebastien/k7/))
* V8CGI: incomplete, for use with the v8cgi project ([http://code.google.com/p/v8cgi/](http://code.google.com/p/v8cgi/))

### Middleware

* Auth: missing
* Cascade: complete
* CommonLogger: complete
* ContentLength: complete
* Deflater: missing
* Directory: missing
* File: complete
* Head: complete
* JSONP: complete
* Lint: mostly complete (needs stream wrappers)
* MethodOverride: complete
* Mock: missing
* Recursive: missing
* ShowExceptions: simple version complete, needs better HTML output
* ShowStatus: missing
* Static: complete
* URLMap: complete

### Utilities

* jackup: complete
* Request: mostly complete
* Response: mostly complete
