.. _geoexplorer.workspace:

GeoExplorer Workspace
=====================

The GeoExplorer workspace is divided into four areas

#. **Map Window**, where the map is displayed
#. **Toolbar**, the bar at the top where zoom, pan, and export tools are accessed
#. **Layers Panel**, where a list of map layers is displayed
#. **Legend Panel**, where the styles of the displayed layers are listed.

  .. figure:: images/working1.png
     :align: center

     *The four areas of GeoExplorer*

Map Window
----------

The primary component of the GeoExplorer workspace is the Map Window.  This displays the currently composed map, along with controls for zoom, pan, and scale.

Toolbar
-------

The Toolbar contains buttons that accomplish certain tasks:

    .. list-table::
       :widths: 15 30 85 

       * - **Button**
         - **Name**
         - **Description**
       * - .. image:: /images/working2.png
         - GeoExplorer
         - Shows information about GeoExplorer.
       * - .. image:: /images/working3.png
         - Save Map
         - Saves the current state of the Map Window.  Generates a URL to use to revisit the current configuration.
       * - .. image:: /images/working4.png
         - Publish
         - Opens a wizard for generating HTML code to embed the contents of the current Map Window into a web page or application.
       * - .. image:: /images/working5.png
         - Pan Map
         - Allows for dragging the map with the mouse and zooming via shift-click-dragging an extent rectangle.  Enabled by default.
       * - .. image:: /images/working6.png
         - Get Feature Info
         - Displays feature info (attributes) for the features located at a particular point.  
       * - .. image:: /images/working7.png
         - Measure
         - Allows for measuring of distance and area on the map.
       * - .. image:: /images/working8.png
         - Zoom In
         - Zooms in by one zoom level.
       * - .. image:: /images/working9.png
         - Zoom Out
         - Zooms out by one zoom level.   
       * - .. image:: /images/working10.png
         - Zoom to previous extent
         - Zooms to the extent you were previously viewing.
       * - .. image:: /images/working11.png
         - Zoom to next extent
         - Zooms to the next extent.  Activated only after using *Zoom to previous extent*.
       * - .. image:: /images/working12.png
         - Zoom to visible extent
         - Zooms to the largest possible area that contains the active layers.
       * - .. image:: /images/working13.png
         - Switch to 3D Viewer
         - Changes map view to 3D.  Requires the `Google Earth browser plugin <http://earth.google.com/plugin/>`_.

Layers Panel
------------

The Layers Panel displays a list of all layers known to GeoExplorer.  Each layer's visibility can be toggled by a check box next to the entry in the list, or by double clicking on the entry.  Layer order can be set by dragging the entries in the list.

The "Base Layers" folder contains a list of layers to use as a base.  This layer will always be beneath all other layers.  Layers can also be moved between the "Base Layers" folder and the "Layers" folder.  Only one base layer can be active at one time.  The default base layer is Google Terrain.

The Layers Panel also contains a small toolbar with the following buttons:

    .. list-table::
       :widths: 15 30 85 

       * - **Button**
         - **Name**
         - **Description**
       * - .. image:: /images/working14.png
         - Add Layers
         - Displays a dialog for adding new layers to GeoExplorer
       * - .. image:: /images/working15.png
         - Remove Layer
         - Removes the currently selected layer.
       * - .. image:: /images/working16.png
         - Layer Properties
         - Displays metadata and global display characteristics about a selected layer.  (For attribute information, use the :guilabel:`Get Feature Info` tool.)

You can also right-click on an entry in the list to display a context menu.
      
      .. figure:: images/working17.png
         :align: center

         *Context menu*
    

Legend Panel
------------

The Legend Panel displays style information for every visible layer.  This list of styles is read-only.  To edit styles for a particular layer, use **Styler**.


