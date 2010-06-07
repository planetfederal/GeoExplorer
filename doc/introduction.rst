.. _geoexplorer.introduction:

Introduction
============

This section is a quick introduction to GeoExplorer.  For more detail, please see the section on :ref:`geoexplorer.working`.

#. Launch GeoServer.  By default this is available at http://localhost:8080/geoexplorer/ in your browser.

   .. figure:: images/intro_geoexplorer.png
      :align: center
   
      *Opening GeoExplorer*

#.  Use the :guilabel:`Add Layers`, :guilabel:`Remove Layers` and :guilabel:`Layer properties` buttons in the Layers Panel to choose the layers to be included in your application.
    
   .. figure:: images/intro_layersbuttons.png
      :align: center
       
      *Add Layers, Remove Layers, and Layer Properties buttons*
    
#.  From the "Available Layers" dialog, select layers to be added to your application.

   .. figure:: images/intro_addlayersdialog.png
      :align: center
       
      *Adding layers to GeoExplerer*

#. If desired, add new WMS servers with the :guilabel:`Add A New Server` button (for example, http://terraservice.net/ogccapabilities.ashx?version=1.1.1&request=GetCapabilities).
    
   .. figure:: images/intro_addnewserver.png
      :align: center
   
      *Adding a new WMS server*
       
#.  Compose your map by ordering layers in the Layers Panel.  Set a layer to be a Base Layer by dragging it to the Base Layer folder.  Only one layer at a time can be visible in the "Base Layer" group.
    
   .. figure:: images/intro_draglayers.png
      :align: center
   
      *Reordering layers*
       
#.  Launch the "Publish Map" wizard to embed your application in a web page.

   .. figure:: images/intro_publish.png
      :align: center

      *Publishing map*

For a more detailled description of what you can do with GeoExplorer, see the section on :ref:`geoexplorer.working`.