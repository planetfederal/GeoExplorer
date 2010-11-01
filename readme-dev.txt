==================
UNDER CONSTRUCTION
==================

These instructions describe how to deploy GeoExplorer assuming you have a copy
of the application source code from subversion.

Getting a copy of the application
---------------------------------

To get a copy of the application source code, use subversion::

    you@prompt:~$ svn checkout http://svn.opengeo.org/suite/trunk/geoexplorer


Dependencies
------------

The GeoExplorer repository contains what you need to run the application as a
servlet with an integrated persistence layer.

To assemble the servlet or run in development mode, you need Ant
(http://ant.apache.org/).  In addition, to pull in external dependencies, you'll
neeed Git installed (http://git-scm.com/).

Before running in development mode or preparing the application for deployment,
you need to pull in external dependencies.  Do this by running ``ant init`` in
the build directory::

    you@prompt:~$ cd geoexplorer/build
    you@prompt:~/geoexplorer/build$ ant init


Running in development mode
---------------------------

The application can be run in development or distribution mode.  In development
mode, individual scripts are available to a debugger.  In distribution mode,
scripts are concatenated and minified.

To run the application in development mode, change into the build directory and
run ant::

    you@prompt:~$ cd geoexplorer/build
    you@prompt:~/geoexplorer/build$ ant debug

If the build succeeds, you'll be able to browse to the application at
http://localhost:8080/.


Preparing the application for deployment
----------------------------------------

Running GeoExplorer as described above is not suitable for production because
JavaScript files will be loaded dynamically.  Before moving your application
to a production environment, run ant with the "dist" or "war" target.  The
"dist" target will result in a directory that can be dropped in a servlet
container, and the "war" target results in a archive of the same directory.

    you@prompt:~$ cd geoexplorer
    you@prompt:~/geoexplorer$ mvn clean install

Move the geoexplorer directory or geoexplorer.war file (from the target
directory) to your production environment (e.g. a GeoServer servlet container).

GeoExplorer writes to a geoexplorer.db when saving maps.  The location of this
file is determined by the GEOEXPLORER_DATA value at runtime.  This value can be
set as a system property or an environment variable.

The GEOEXPLORER_DATA value must be a path to a directory that is writable by 
the process that runs the application.  The system property is given precedence
over an environment variable if both exist.
