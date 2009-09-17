========================
Working With GeoExplorer
========================

Overview
--------

GeoExplorer is divided into four areas:

* The main area is covered by the map with the map controls for zooming and
  panning.
  
* The button bar on top contains the following buttons:

  - GeoExplorer: click to see about information and credits.
  - Publish map: click to open a wizard for building an embeddable map widget
    with the layers you are currently viewing.
  - Bookmark: click to create a permalink for a GeoExplorer configured
    with the layers and extent you are currently looking at.
  - Pan Map: enabled by default, for dragging the map with the mouse and
    zooming by shift-click-dragging an extent rectangle.
  - Get Feature Info: if active, clicking on the map will open a Feature
    Info Popup for the clicked location and the currently visible layers.
    if they are queryable.
  - Measure: an expandable button for measuring distance and area when
    active. To measure, click on the map, drawing a line for distance or a
    polygon for area measurement. Freehand measuring can be activated by
    pressing and holding the shift key. Double click on the map to draw the
    last vertex of the measurement line or polygon. The distance or area will
    be displayed in a small popup.
  - Zoom in: click to zoom in by one zoom level.
  - Zoom out: click to zoom out by one zoom level.
  - Zoom to previous extent: click to zoom to the extent you were previously
    viewing.
  - Zoom to next extent: after using the ``Zoom to previous extent`` button,
    click to zoom to the next extent.
  - Zoom to visible extent: click to view the largest possible area
  
* The Layers panel for managing layers:

  - Click (+) to add layers.
  - Click (-) to remove the currently selected layer.
  - Drag and drop layers to change layer order.
  - Click checkboxes or radio buttons to make layers visible/invisible.
  - Click on the layer name to select a layer.
  - Double click on a layer to toggle visibility.
  - Right click on a layer to show a context menu, allowing to zoom to the
    layer extent or to remove the layer.
    
* The Legend panel displaying a legend for every visible layer.

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
http://terraserver-usa.com/ogccapabilities.ashx).

Publishing A Map Widget
-----------------------

Based on the currently configured layers and extent, an embeddable map widget
can be created by clicking the ``Publish Map`` button on the button bar.

In the first page of the wizard, select the initial visibility of the layers.
On the second page, the map size can be specified, either by selecting a
pre-configured size from the dropdown, or enter a width and height. When you
are satisfied, copy the HTML and paste it in your website. That's it! 