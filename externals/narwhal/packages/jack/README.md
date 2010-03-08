
JSGI & Jack
===========

JSGI is a web server interface specification for JavaScript, inspired by Ruby's Rack ([http://rack.rubyforge.org/](http://rack.rubyforge.org/)) and Python's WSGI ([http://www.wsgi.org/](http://www.wsgi.org/)). It provides a common API for connecting JavaScript frameworks and applications to webservers.

Jack is a collection of JSGI compatible handlers (connect web servers to JavaScript web application/frameworks), middleware (intercept and manipulate requests to add functionality), and other utilities (to help build middleware, frameworks, and applications).


### Homepage:

* [http://jackjs.org/](http://jackjs.org/)
* [http://narwhaljs.org/](http://narwhaljs.org/)

### Source & Download:

* [http://github.com/tlrobinson/jack/](http://github.com/tlrobinson/jack/)
* [http://github.com/tlrobinson/narwhal/](http://github.com/tlrobinson/narwhal/)

### Mailing list:

* [http://groups.google.com/group/narwhaljs](http://groups.google.com/group/narwhaljs)

### IRC:

* [\#narwhal on irc.freenode.net](http://webchat.freenode.net/?channels=narwhal)


JSGI Specification
------------------

View the [JSGI specification](http://jackjs.org/jsgi-spec.html).


Example JSGI Application
------------------------

    function(env) {
        return {
            status : 200,
            headers : {"Content-Type":"text/plain"},
            body : ["Hello world!"]
        };
    }


JSGI vs. Rack
-------------

JSGI applications are simply functions, rather than objects that respond to the "call" method. The body must have a `forEach` method which yields objects which have a `toByteString` method, as opposed to Strings.


JSGI vs. WSGI
-------------

WSGI uses a `start_response` function to set the HTTP status code and headers, rather than returning them in an array. JSGI is similar to WSGI 2.0: [http://www.wsgi.org/wsgi/WSGI_2.0](http://www.wsgi.org/wsgi/WSGI_2.0).


Contributors
------------

* [Tom Robinson](http://tlrobinson.net/)
* [George Moschovitis](http://blog.gmosx.com/)
* [Kris Kowal](http://askawizard.blogspot.com/)
* Neville Burnell
* [Isaac Z. Schlueter](http://blog.izs.me/)
* Jan Varwig
* [Irakli Gozalishvili](http://rfobic.wordpress.com/)
* [Kris Zyp](http://www.sitepen.com/blog/author/kzyp/)
* [Kevin Dangoor](http://www.blueskyonmars.com/)
* Antti Holvikari
* Tim Schaub


Acknowledgments
---------------

This software was influenced by Rack, written by Christian Neukirchen.

[http://rack.rubyforge.org/](http://rack.rubyforge.org/)


License
-------

Copyright (c) 2009 Thomas Robinson <[280north.com](http://280north.com/)\>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

