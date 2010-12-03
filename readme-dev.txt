===========
GeoExplorer
===========

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
the geoexplorer directory::

    you@prompt:~$ cd geoexplorer/
    you@prompt:~/geoexplorer$ ant init


Running in development mode
---------------------------

The application can be run in development or distribution mode.  In development
mode, individual scripts are available to a debugger.  In distribution mode,
scripts are concatenated and minified.

To run the application in development mode, run `ant debug`::

    you@prompt:~$ cd geoexplorer
    you@prompt:~/geoexplorer$ ant debug

If the build succeeds, you'll be able to browse to the application at
http://localhost:8080/.


Preparing the application for deployment
----------------------------------------

Running GeoExplorer as described above is not suitable for production because
JavaScript files will be loaded dynamically.  Before moving your application
to a production environment, run ant with the "dist" target.  The
"dist" target will result in a directory that can be dropped in a servlet
container.

    you@prompt:~$ cd geoexplorer
    you@prompt:~/geoexplorer$ ant dist

Move the build/geoexplorer directory to your production environment (e.g. a 
servlet container).

GeoExplorer writes to a geoexplorer.db when saving maps.  The location of this
file is determined by the GEOEXPLORER_DATA value at runtime.  This value can be
set as a servlet initialization parameter or a Java system property.

The GEOEXPLORER_DATA value must be a path to a directory that is writable by 
the process that runs the application.  The servlet initialization parameter
is given precedence over a system property if both exist.

As an example, if you want the geoexplorer.db file to be written to your /tmp
directory, modify GeoExplorer's web.xml file to include the following::

    <init-param>
        <param-name>GEOEXPLORER_DATA</param-name>
        <param-value>/tmp</param-value>
    </init-param>

