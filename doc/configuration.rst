.. _geoexplorer.configuration:

Configuration
=============

This page shows some advanced configuration options for GeoExplorer.

Initial configuration
---------------------

If you want to provide a customized application builder, here is how
to configure it:

The startup WMS or additional WMS servers can be configured by modifying
GeoExplorer/index.html:

.. code-block:: javascript

    wms: {
        "demo": "http://demo.opengeo.org/geoserver/ows/"
    },

"demo" is the key used to reference the WMS in the layer configuration (see
below). More servers can be added easily, e.g. by changing the above to

.. code-block:: javascript

    wms: {
        "demo": "http://demo.opengeo.org/geoserver/ows/",
        "terraserver": "http://terraserver-usa.com/ogccapabilities.ashx"
    },

Two layers will be loaded by default:

 * Global Imagery (topp:bluemarble) as base layer
 * USA Population (topp:states) as overlay

The layers to be loaded at startup can be configured in GeoExplorer/index.html:

.. code-block:: javascript

    map: {
        layers: [{
            name: "topp:bluemarble",
            title: "Global Imagery",
            wms: "demo",
            group: "background"
        }, {
            name: "topp:states",
            wms: "demo",
            visibility: true
        }],
        center: [-96.7, 37.6],
        zoom: 4
    }

The ``name`` property of the layers (e.g. "topp:states" in the above snippet)
are the layer names from the Capabilities document of the
WMS (see
`<http://demo.opengeo.org/geoserver/ows/?SERVICE=WMS&REQUEST=GetCapabilities>`_
for a complete example):

.. code-block:: xml

      <Layer queryable="1">
        <Name>topp:states</Name>
        <Title>USA Population</Title>
        <Abstract>This is some census data on the states.</Abstract>
        <KeywordList>
          <Keyword>census</Keyword>
          <Keyword>united</Keyword>
          <Keyword>boundaries</Keyword>
          <Keyword>state</Keyword>
          <Keyword>states</Keyword>
        </KeywordList>
        <SRS>EPSG:4326</SRS>
        <LatLonBoundingBox minx="-125.30903773" miny="7.705448770000002" maxx="-66.39223326999999" maxy="66.62225323"/>
        <BoundingBox SRS="EPSG:4326" minx="-124.73142200000001" miny="24.955967" maxx="-66.969849" maxy="49.371735"/>
        <Style>
          <Name>population</Name>
          <Title>Population in the United States</Title>
          <Abstract>A sample filter that filters the United States into three
        categories of population, drawn in different colors</Abstract>
          <LegendURL width="20" height="20">
            <Format>image/png</Format>
            <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://demo.opengeo.org/geoserver/wms/GetLegendGraphic?VERSION=1.0.0&amp;FORMAT=image/png&amp;WIDTH=20&amp;HEIGHT=20&amp;LAYER=topp:states"/>
          </LegendURL>
        </Style>
      </Layer>

The ``title`` property is optional. By default, the title from the
Capabilities document will be used.

The ``wms`` property tells the application on which server to find the layer.
If we would like to add a layer from the "terraserver" WMS that we configured
above, we would simply set ``wms`` to "terraserver".

Layers that should not be visible when loading the application, but shown in
the layer tree, can be configured with the ``visibility`` property set to
false.

Layers with the ``group`` property set to "background" will be base layers.
Only one base layer can be visible at a time.

The ``center`` and ``zoom`` properties are also optional. If not provided,
the map extent will be set to the LatLonBoundingBox specified in the
Capabilities document. For a configuration with more than one layers, the
extent will be taken from the first layer in the "background" group, or the
first layer if there are no layers in the "background" group.

OGC service proxy
-----------------

GeoExplorer will run on any HTTP server, like Apache. All that needs to be
done is unpack GeoExplorer to a web accessible path on your server. There is
only server side requirement: an OGC service proxy. If you have Python
installed, you can use the OpenGeo python proxy, available at:
http://svn.opengeo.org/util/proxy/proxy.py. Information on how to configure
Apache to use that proxy are included in the file.
