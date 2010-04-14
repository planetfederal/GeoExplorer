/**
 * Copyright (c) 2009-2010 The Open Planning Project
 *
 * @requires GeoExplorer.js
 */

/**
 * api: (define)
 * module = GeoExplorer
 * class = CapabilitiesGrid(config)
 * extends = Ext.grid.GridPanel
 */

/** api: constructor
 * ..class:: CapabilitiesGrid(config)
 * :param: config: A configuration :class:`Object`
 *
 * Create a new grid displaying the WMS cabilities of a URL, or the contents of 
 * a :class:`GeoExt.data.WMSCapabilitiesStore`\ .  The user can add layers to a
 * passed-in :class:`GeoExt.MapPanel` from the grid.
 */

Ext.namespace("GeoExplorer");
GeoExplorer.CapabilitiesGrid = Ext.extend(Ext.grid.GridPanel, {

    store: null,

    cm: null,

    /**
     * api: property[mapPanel]
     * A :class:`GeoExt.MapPanel` to which layers can be added via this grid.
     */
    mapPanel : null,

    /** api: property[url]
     * A :class:`String` containing an OWS URL to which the GetCapabilities 
     * request is sent.  Necessary if a store is not passed in as a 
     * configuration option.
     */
    url: null,

    autoExpandColumn: "title",

    /** api: method[initComponent]
     * 
     * Initializes the CapabilitiesGrid. Creates and loads a WMS Capabilities 
     * store from the url property if one is not passed as a configuration 
     * option. 
     */
    initComponent: function(){

        if(!this.store){
            this.store = new GeoExt.data.WMSCapabilitiesStore({
                url: this.url + "?service=wms&request=GetCapabilities"
            });

            this.store.load();
        }

        var expander = new Ext.grid.RowExpander({
            tpl : new Ext.Template(
                '<p><b>Abstract:</b> {abstract}</p>')});

        this.plugins = expander;

        this.cm = new Ext.grid.ColumnModel([
            expander,
            {header: "Name", dataIndex: "name", width: 180, sortable: true},
            {id: "title", header: "Title", dataIndex: "title", sortable: true},
            {header: "Queryable", dataIndex: "queryable"}
        ]);

        GeoExplorer.CapabilitiesGrid.superclass.initComponent.call(this);       
    },

    /** api: method[addLayers]
     * :param: base: a boolean indicating whether or not to make the new layer 
     *     a base layer.
     * 
     * Adds a layer to the :class:`GeoExt.MapPanel` of this instance.
     */    
    addLayers : function(base){

        var sm = this.getSelectionModel();

        //for now just use the first selected record
        //TODO: force single selection (until we allow
        //adding group layers)
        var records = sm.getSelections();
        
        var record, layer;
        var mapProj = new OpenLayers.Projection(this.mapPanel.map.getProjectionObject());
        var ggProj = new OpenLayers.Projection("EPSG:4326");
        for(var i = 0; i < records.length; i++){
            Ext.data.Record.AUTO_ID++;
            record = records[i].copy(Ext.data.Record.AUTO_ID);

            layer = record.get("layer").clone();
            record.data.layer = layer;
            
            // TODO: allow config for layer options
            layer.buffer = 0;
            layer.tileSize = new OpenLayers.Size(256, 256);

            /*
             * TODO: deal with srs and maxExtent - this should be done in the
             * CapabilitiesReader or by the serviceType provider.
             * At this point, we need to think about SRS if we want the layer to
             * have a maxExtent.  For our app, we are dealing with EPSG:4326
             * only.  This will have to be made more generic for apps that use
             * other srs.
             */

            layer.restrictedExtent = OpenLayers.Bounds.fromArray(record.get("llbbox")).transform(
                ggProj, mapProj
            );

            if (this.alignToGrid) {
                layer.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90).transform(
                    ggProj, mapProj
                );
            } else {
                layer.maxExtent = layer.restrictedExtent;
            } 

            record.set("background", base && "background");
            this.mapPanel.layers.insert(
                base ? 0 : this.mapPanel.layers.getCount(),
                record
            );
        }

    }
});
