.. _geoexplorer.working:

Working With GeoExplorer
========================

Overview
--------

GeoExplorer is divided into four areas:

  .. figure:: images/working1.png
     :align: center
     :width: 600px

     *The four sections of GeoExplorer*

#. The main area is covered by the map with the map controls for zooming and panning.
  
#. The button bar on top contains the following buttons:

    .. list-table::
       :widths: 15 30 85 

       * - **Button**
         - **Name**
         - **Description**
       * - .. image:: /images/working2.png
         - GeoExplorer
         - About information and credits.
       * - .. image:: /images/working3.png
         - Save Map
         - Create a permalink for a GeoExplorer configured with the layers and extent you are currently looking at.
       * - .. image:: /images/working4.png
         - Publish
         - Open a wizard for building an embeddable map widget with the layers you are currently viewing.
       * - .. image:: /images/working5.png
         - Pan Map
         - Enabled by default, use for dragging the map with the mouse and zooming by shift-click-dragging an extent rectangle.
       * - .. image:: /images/working6.png
         - Get Feature Info
         - If active, clicking on the map will open a Feature Info Popup for the clicked location and current visible layers, if query-able.
       * - .. image:: /images/working7.png
         - Measure
         - An expandable button for measuring distance and area when active. To measure, click on the map, drawing a line for distance or a polygon for area measurement. Freehand measuring can be activated by pressing and holding the shift key. Double click on the map to draw the last vertex of the measurement line or polygon. The distance or area will be displayed in a small popup.
       * - .. image:: /images/working8.png
         - Zoom-In
         - Zoom-in by one zoom level.
       * - .. image:: /images/working9.png
         - Zoom-Out
         - Zoom-out by one zoom level.   
       * - .. image:: /images/working10.png
         - Zoom to previous extent
         - Zoom to the extent you were previously viewing.
       * - .. image:: /images/working11.png
         - Zoom to next extent
         - After using the ``Zoom to previous extent`` button, click to zoom to the next extent.
       * - .. image:: /images/working12.png
         - Zoom to visible extent
         - Click to view the largest possible area.
       * - .. image:: /images/working13.png
         - 3D Viewer
         - Switch map view to 3D Google Earth.

#. The Layers panel for managing layers:

    .. list-table::
       :widths: 15 85 

       * - **Button**
         - **Description**
       * - .. image:: /images/working14.png
         - Click (+) to add layers.
       * - .. image:: /images/working15.png
         - Click (-) to remove the currently selected layer.
       * - .. image:: /images/working16.png
         - For a selected later, presents *About* and *Display* information.
  
    - Drag and drop layers to change layer order.
    - Click checkboxes or radio buttons to make layers visible/invisible.
    - Click on the layer name to select a layer.
    - Double click on a layer to toggle visibility.
    - Right click on a layer to show a context menu, allowing to zoom to the
      layer extent, remove the layer, or view layer properties.
      
      .. figure:: images/working17.png
         :align: center

         *Context Menu for Medford, OR - Wetlands layer*
    
#. The Legend panel displaying a legend for every visible layer.

Adding Layers
-------------

Clicking on the (+) button in the layers panel will open the ``Available
Layers`` dialog. The grid lists all layers available on the currently
selected WMS server. Clicking on the [+] next to each layer, meta information
about the layer will be displayed. Double click a layer row in the grid, or
select layers and click ``Add Layers`` to add them to the map.

To see layers from a different WMS server in the grid, select a server from
the ``View available data from:`` combo box, or add a new WMS server by
clicking on ``or add a new server``. A small window will pop up, where a
WMS service URL can be entered (e.g.
http://terraservice.net/ogccapabilities.ashx?version=1.1.1&amp;request=GetCapabilties).

Publishing A Map Widget
-----------------------

Based on the currently configured layers and extent, an embeddable map widget
can be created by clicking the ``Publish Map`` button on the button bar.

In the first page of the wizard, select the initial visibility of the layers.
On the second page, the map size can be specified, either by selecting a
pre-configured size from the dropdown, or enter a width and height. When you
are satisfied, copy the HTML and paste it in your website. That's it! 