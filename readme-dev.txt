=================================
Running and deploying GeoExplorer
=================================

These instructions describe how to deploy GeoExplorer assuming you have a copy
of the application source code from subversion.

Getting a copy of the application
---------------------------------

To get a copy of the application source code, use subversion::

    you@prompt:~$ svn checkout http://svn.opengeo.org/vulcan/trunk/geoexplorer


Dependencies
------------

The GeoExplorer repository contains what you need to run the application as a
servlet with an integrated persistence layer.  The easiest way to deploy the
application is to include it in a servlet container with GeoServer.

To use the application for composing maps from multiple WMS endpoints, you also
need to have a proxy running on the same origin as the application.  The easiest
way to get a proxy running next to the application is to use the Proxy Extension
for GeoServer.

Find details here: http://geoserver.org/display/GEOS/GeoServer+Proxy+Extension


Running in development mode
---------------------------

The application can be run in development or distribution mode.  In development
mode, individual scripts are available to a debugger.  In distribution mode,
scripts are concatenated and minified.

To run the application in development mode, change into the build directory and
run ant::

    you@prompt:~$ cd geoexplorer/build
    you@prompt:~/geoexplorer/build$ ant dev

If the build succeeds, everything you need to run the application will be in the
new build/geoexplorer directory.  This directory needs to be placed in a servlet
container.  The easiest way to do this for development is to create a symbolic
link from your servlet container to the application build.  Create this link
and start up GeoServer::

    you@prompt:~/geoexplorer/build$ cd /path/to/geoserver
    you@prompt:/path/to/geoserver$ ln -s ~/geoexplorer/build/geoexplorer webapps/geoexplorer
    you@prompt:/path/to/geoserver$ bin/startup.sh
    
After GeoServer starts, you should be able to load the application in your
browser (http://localhost:8080/geoexplorer).


Preparing the application for deployment
----------------------------------------

Running GeoExplorer as described above is not suitable for production because
JavaScript files will be loaded dynamically.  Before moving your application
to a production environment, follow the steps below.

1. Copy any changes to the app configuration you made in GeoExplorer/index.html
into the geoexplorer/src/client/html/index.html file. Just copy the changes to
the JavaScript - do not copy the entire contents of the file.

2. If you have not already set up JSTools, do so following the instructions
you find on the JSTools project page: http://pypi.python.org/pypi/JSTools

3. Run ant to build the application for distribution.

For example, to create a directory that can be moved to your production
environment, do the following::

    you@prompt:~$ cd geoexplorer/build
    you@prompt:~/geoexplorer/build$ ant

Move the geoexplorer directory (from the build directory) to your production
environment (e.g. a GeoServer servlet container).

