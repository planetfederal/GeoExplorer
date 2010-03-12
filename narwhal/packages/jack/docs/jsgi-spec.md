
JSGI Specification, v0.2
========================

Applications
------------

A JSGI application is a JavaScript function. It takes exactly one argument, the **environment**, and returns a JavaScript Object containing three properties: the **status**, the **headers**, and the **body**.

Middleware
----------

JSGI middleware is typically a function that takes at least one other JSGI application and returns another function which is also a JSGI application.

The Environment
---------------

The environment must be a JavaScript Object instance that includes CGI-like headers. The application is free to modify the environment. The environment is required to include these variables (adopted from PEP333 and Rack), except when they'd be empty, but see below.

* `REQUEST_METHOD`: The HTTP request method, such as "GET" or "POST". This cannot ever be an empty string, and so is always required.
* `SCRIPT_NAME`: The initial portion of the request URL‘s "path" that corresponds to the application object, so that the application knows its virtual "location". This may be an empty string, if the application corresponds to the "root" of the server.
* `PATH_INFO`: The remainder of the request URL‘s "path", designating the virtual "location" of the request‘s target within the application. This may be an empty string, if the request URL targets the application root and does not have a trailing slash. This value may be percent-encoded when I originating from a URL.
* `QUERY_STRING`: The portion of the request URL that follows the ?, if any. May be empty, but is always required!
* `SERVER_NAME`, `SERVER_PORT`: When combined with `SCRIPT_NAME` and `PATH_INFO`, these variables can be used to complete the URL. Note, however, that `HTTP_HOST`, if present, should be used in preference to `SERVER_NAME` for reconstructing the request URL. `SERVER_NAME` and `SERVER_PORT` can never be empty strings, and so are always required.
* HTTP_ Variables: Variables corresponding to the client-supplied HTTP request headers (i.e., variables whose names begin with HTTP\_). The presence or absence of these variables should correspond with the presence or absence of the appropriate HTTP header in the request.

In addition to this, the JSGI environment must include these JSGI-specific variables:

* `jsgi.version`: The Array \[0,2\], representing this version of JSGI.
* `jsgi.url_scheme`: http or https, depending on the request URL.
* `jsgi.input`: See below, the input stream.
* `jsgi.errors`: See below, the error stream.
* `jsgi.multithread`: true if the application object may be simultaneously invoked by another thread in the same process, false otherwise.
* `jsgi.multiprocess`: true if an equivalent application object may be simultaneously invoked by another process, false otherwise.
* `jsgi.run_once`: true if the server expects (but does not guarantee!) that the application will only be invoked this one time during the life of its containing process. Normally, this will only be true for a server based on CGI (or something similar).

The server or the application can store their own data in the environment, too. The keys must contain at least one dot, and should be prefixed uniquely. The prefix *jsgi.* is reserved for use with the JSGI core distribution and must not be used otherwise. The environment must not contain the keys `HTTP_CONTENT_TYPE` or `HTTP_CONTENT_LENGTH` (use the versions without HTTP_). The CGI keys (named without a period) must have String values. There are the following restrictions:

* `jsgi.version` must be an array of Integers.
* `jsgi.url_scheme` must either be http or https.
* There must be a valid input stream in `jsgi.input`.
* There must be a valid error stream in `jsgi.errors`.
* The `REQUEST_METHOD` must be a valid token.
* The `SCRIPT_NAME`, if non-empty, must start with /
* The `PATH_INFO`, if non-empty, must start with /
* The `CONTENT_LENGTH`, if given, must consist of digits only.
* One of `SCRIPT_NAME` or `PATH_INFO` must be set. `PATH_INFO` should be / if `SCRIPT_NAME` is empty. `SCRIPT_NAME` never should be /, but instead be empty.

### The Input Stream

Must be an input stream.

### The Error Stream

Must be an output stream.


The Response
------------

### The Status

The status, if parsed as integer, must be greater than or equal to 100.

### The Headers

The header must be a JavaScript object containing key/value pairs of Strings. The header must not contain a Status key, contain keys with : or newlines in their name, contain keys names that end in - or \_, but only contain keys that consist of letters, digits, \_ or - and start with a letter. The values of the header must be Strings, consisting of lines (for multiple header values) separated by "\n". The lines must not contain characters below 037.

### The Content-Type

There must be a `Content-Type`, except when the Status is 1xx, 204 or 304, in which case there must be none given.

### The Content-Length

There must not be a Content-Length header when the Status is 1xx, 204 or 304.

### The Body

The Body must respond to `forEach` and must only yield objects which have a `toByteString` method (including Strings and Binary objects). If the Body responds to `close`, it will be called after iteration. The Body commonly is an array of Strings or ByteStrings.


Acknowledgements
----------------

This specification is adapted from the Rack specification ([http://rack.rubyforge.org/doc/files/SPEC.html](http://rack.rubyforge.org/doc/files/SPEC.html)) written by Christian Neukirchen.

Some parts of this specification are adopted from PEP333: Python Web Server Gateway Interface v1.0 ([www.python.org/dev/peps/pep-0333/](www.python.org/dev/peps/pep-0333/)).
