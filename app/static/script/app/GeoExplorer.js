/**
 * Copyright (c) 2009-2011 The Open Planning Project
 */

Ext.USE_NATIVE_JSON = true;

(function() {
    // backwards compatibility for reading saved maps
    // these source plugins were renamed after 2.3.2
    Ext.preg("gx_wmssource", gxp.plugins.WMSSource);
    Ext.preg("gx_olsource", gxp.plugins.OLSource);
    Ext.preg("gx_googlesource", gxp.plugins.GoogleSource);
    Ext.preg("gx_bingsource", gxp.plugins.BingSource);
    Ext.preg("gx_osmsource", gxp.plugins.OSMSource);
})();

/**
 * api: (define)
 * module = GeoExplorer
 * extends = gxp.Viewer
 */

/** api: constructor
 *  .. class:: GeoExplorer(config)
 *     Create a new GeoExplorer application.
 *
 *     Parameters:
 *     config - {Object} Optional application configuration properties.
 *
 *     Valid config properties:
 *     map - {Object} Map configuration object.
 *     sources - {Object} An object with properties whose values are WMS endpoint URLs
 *
 *     Valid map config properties:
 *         projection - {String} EPSG:xxxx
 *         units - {String} map units according to the projection
 *         maxResolution - {Number}
 *         layers - {Array} A list of layer configuration objects.
 *         center - {Array} A two item array with center coordinates.
 *         zoom - {Number} An initial zoom level.
 *
 *     Valid layer config properties (WMS):
 *     name - {String} Required WMS layer name.
 *     title - {String} Optional title to display for layer.
 */
var GeoExplorer = Ext.extend(gxp.Viewer, {

    // Begin i18n.
    zoomSliderText: "<div>Zoom Level: {zoom}</div><div>Scale: 1:{scale}</div>",
    loadConfigErrorText: "Trouble reading saved configuration: <br />",
    loadConfigErrorDefaultText: "Server Error.",
    xhrTroubleText: "Communication Trouble: Status ",
    layersText: "Layers",
    titleText: "Title",
    zoomLevelText: "Zoom level",
    switch3dText: "Switch to 3D Viewer",
    saveErrorText: "Trouble saving: ",
    bookmarkText: "Bookmark URL",
    permakinkText: 'Permalink',
    appInfoText: "GeoExplorer",
    aboutText: "About GeoExplorer",
    mapInfoText: "Map Info",
    descriptionText: "Description",
    contactText: "Contact",
    aboutThisMapText: "About this Map",
    // End i18n.
    
    /**
     * private: property[mapPanel]
     * the :class:`GeoExt.MapPanel` instance for the main viewport
     */
    mapPanel: null,
    
    toggleGroup: "toolGroup",

    constructor: function(config) {
        this.mapItems = [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100,
            plugins: new GeoExt.ZoomSliderTip({
                template: this.zoomSliderText
            })
        }];

        // both the Composer and the Viewer need to know about the viewerTools
        // First row in each object is needed to correctly render a tool in the treeview
        // of the embed map dialog. TODO: make this more flexible so this is not needed.
        config.viewerTools = [
            {
                leaf: true, 
                text: gxp.plugins.Navigation.prototype.tooltip, 
                checked: true, 
                iconCls: "gxp-icon-pan",
                ptype: "gxp_navigation", 
                toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 2}
            }, {
                leaf: true, 
                text: gxp.plugins.WMSGetFeatureInfo.prototype.infoActionTip, 
                checked: true, 
                iconCls: "gxp-icon-getfeatureinfo",
                ptype: "gxp_wmsgetfeatureinfo", 
                toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 3}
            }, {
                leaf: true, 
                text: gxp.plugins.Measure.prototype.measureTooltip, 
                checked: true, 
                iconCls: "gxp-icon-measure-length",
                ptype: "gxp_measure", 
                toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 4}
            }, {
                leaf: true, 
                text: gxp.plugins.Zoom.prototype.zoomInTooltip + " / " + gxp.plugins.Zoom.prototype.zoomOutTooltip, 
                checked: true, 
                iconCls: "gxp-icon-zoom-in",
                ptype: "gxp_zoom",
                actionTarget: {target: "paneltbar", index: 5}
            }, {
                leaf: true, 
                text: gxp.plugins.NavigationHistory.prototype.previousTooltip + " / " + gxp.plugins.NavigationHistory.prototype.nextTooltip, 
                checked: true, 
                iconCls: "gxp-icon-zoom-previous",
                ptype: "gxp_navigationhistory",
                actionTarget: {target: "paneltbar", index: 7}
            }, {
                leaf: true, 
                text: gxp.plugins.ZoomToExtent.prototype.tooltip, 
                checked: true, 
                iconCls: gxp.plugins.ZoomToExtent.prototype.iconCls,
                ptype: "gxp_zoomtoextent",
                actionTarget: {target: "paneltbar", index: 9}
            }, {
                leaf: true, 
                text: gxp.plugins.Legend.prototype.tooltip, 
                checked: true, 
                iconCls: "gxp-icon-legend",
                ptype: "gxp_legend",
                actionTarget: {target: "paneltbar", index: 10}
            }
        ]; 

        GeoExplorer.superclass.constructor.apply(this, arguments);
    }, 

    loadConfig: function(config) {
        
        var mapUrl = window.location.hash.substr(1);
        var match = mapUrl.match(/^maps\/(\d+)$/);
        if (match) {
            this.id = Number(match[1]);
            OpenLayers.Request.GET({
                url: mapUrl,
                success: function(request) {
                    var addConfig = Ext.util.JSON.decode(request.responseText);
                    this.applyConfig(Ext.applyIf(addConfig, config));
                },
                failure: function(request) {
                    var obj;
                    try {
                        obj = Ext.util.JSON.decode(request.responseText);
                    } catch (err) {
                        // pass
                    }
                    var msg = this.loadConfigErrorText;
                    if (obj && obj.error) {
                        msg += obj.error;
                    } else {
                        msg += this.loadConfigErrorDefaultText;
                    }
                    this.on({
                        ready: function() {
                            this.displayXHRTrouble(msg, request.status);
                        },
                        scope: this
                    });
                    delete this.id;
                    window.location.hash = "";
                    this.applyConfig(config);
                },
                scope: this
            });
        } else {
            var query = Ext.urlDecode(document.location.search.substr(1));
            if (query && query.q) {
                var queryConfig = Ext.util.JSON.decode(query.q);
                Ext.apply(config, queryConfig);
            }
            this.applyConfig(config);
        }
        
    },
    
    displayXHRTrouble: function(msg, status) {
        
        Ext.Msg.show({
            title: this.xhrTroubleText + status,
            msg: msg,
            icon: Ext.MessageBox.WARNING
        });
        
    },
    
    /** private: method[initPortal]
     * Create the various parts that compose the layout.
     */
    initPortal: function() {
        
        // TODO: make a proper component out of this
        var mapOverlay = this.createMapOverlay();
        this.mapPanel.add(mapOverlay);

        var westPanel = new Ext.Panel({
            border: false,
            layout: "border",
            region: "west",
            width: 250,
            split: true,
            collapsible: true,
            collapseMode: "mini",
            header: false,
            items: [
                {region: 'center', autoScroll: true, tbar: [], border: false, id: 'tree', title: this.layersText}, 
                {region: 'south', xtype: "container", layout: "fit", border: false, height: 200, id: 'legend'}
            ]
        });
        
        this.toolbar = new Ext.Toolbar({
            disabled: true,
            id: 'paneltbar',
            items: this.createTools()
        });
        this.on("ready", function() {
            // enable only those items that were not specifically disabled
            var disabled = this.toolbar.items.filterBy(function(item) {
                return item.initialConfig && item.initialConfig.disabled;
            });
            this.toolbar.enable();
            disabled.each(function(item) {
                item.disable();
            });
        });

        var googleEarthPanel = new gxp.GoogleEarthPanel({
            mapPanel: this.mapPanel,
            listeners: {
                beforeadd: function(record) {
                    return record.get("group") !== "background";
                }
            }
        });

        googleEarthPanel.on("show", function() {
            var layersContainer = Ext.getCmp('layertree');
            if (layersContainer && layersContainer.getTopToolbar()) {
                layersContainer.getTopToolbar().setDisabled(true);
            }
        }, this);

        googleEarthPanel.on("hide", function() {
            var layersContainer = Ext.getCmp('layertree');
            if (layersContainer && layersContainer.getTopToolbar()) {
                layersContainer.getTopToolbar().setDisabled(false);
            }
        }, this);

        this.mapPanelContainer = new Ext.Panel({
            layout: "card",
            region: "center",
            defaults: {
                border: false
            },
            items: [
                this.mapPanel,
                googleEarthPanel
            ],
            activeItem: 0
        });
        
        this.portalItems = [{
            region: "center",
            layout: "border",
            tbar: this.toolbar,
            items: [
                this.mapPanelContainer,
                westPanel
            ]
        }];
        
        GeoExplorer.superclass.initPortal.apply(this, arguments);        
    },
    
    /** private: method[createMapOverlay]
     * Builds the :class:`Ext.Panel` containing components to be overlaid on the
     * map, setting up the special configuration for its layout and 
     * map-friendliness.
     */
    createMapOverlay: function() {
        var scaleLinePanel = new Ext.BoxComponent({
            autoEl: {
                tag: "div",
                cls: "olControlScaleLine overlay-element overlay-scaleline"
            }
        });

        scaleLinePanel.on('render', function(){
            var scaleLine = new OpenLayers.Control.ScaleLine({
                div: scaleLinePanel.getEl().dom
            });

            this.mapPanel.map.addControl(scaleLine);
            scaleLine.activate();
        }, this);

        var zoomStore = new GeoExt.data.ScaleStore({
            map: this.mapPanel.map
        });

        var zoomSelector = new Ext.form.ComboBox({
            emptyText: this.zoomLevelText,
            tpl: '<tpl for="."><div class="x-combo-list-item">1 : {[parseInt(values.scale)]}</div></tpl>',
            editable: false,
            triggerAction: 'all',
            mode: 'local',
            store: zoomStore,
            width: 110
        });

        zoomSelector.on({
            click: function(evt) {
                evt.stopEvent();
            },
            mousedown: function(evt) {
                evt.stopEvent();
            },
            select: function(combo, record, index) {
                this.mapPanel.map.zoomTo(record.data.level);
            },
            scope: this
        });

        var zoomSelectorWrapper = new Ext.Panel({
            items: [zoomSelector],
            cls: 'overlay-element overlay-scalechooser',
            border: false 
        });

        this.mapPanel.map.events.register('zoomend', this, function() {
            var scale = zoomStore.queryBy(function(record) {
                return this.mapPanel.map.getZoom() == record.data.level;
            }, this);

            if (scale.length > 0) {
                scale = scale.items[0];
                zoomSelector.setValue("1 : " + parseInt(scale.data.scale, 10));
            } else {
                if (!zoomSelector.rendered) {
                    return;
                }
                zoomSelector.clearValue();
            }
        });

        var mapOverlay = new Ext.Panel({
            // title: "Overlay",
            cls: 'map-overlay',
            items: [
                scaleLinePanel,
                zoomSelectorWrapper
            ]
        });


        mapOverlay.on("afterlayout", function(){
            scaleLinePanel.getEl().dom.style.position = 'relative';
            scaleLinePanel.getEl().dom.style.display = 'inline';

            mapOverlay.getEl().on("click", function(x){x.stopEvent();});
            mapOverlay.getEl().on("mousedown", function(x){x.stopEvent();});
        }, this);

        return mapOverlay;
    },

    /** private: method[createTools]
     * Create the toolbar configuration for the main panel.  This method can be 
     * overridden in derived explorer classes such as :class:`GeoExplorer.Composer`
     * or :class:`GeoExplorer.Viewer` to provide specialized controls.
     */
    createTools: function() {
        

        var toolGroup = this.toggleGroup;

        var enable3DButton = new Ext.Button({
            iconCls: "icon-3D",
            tooltip: this.switch3dText,
            enableToggle: true,
            toggleHandler: function(button, state) {
                if (state === true) {
                    this.mapPanelContainer.getLayout().setActiveItem(1);
                    this.toolbar.disable();
                    button.enable();
                } else {
                    this.mapPanelContainer.getLayout().setActiveItem(0);
                    this.toolbar.enable();
                }
            },
            scope: this
        });
    
        var tools = [
            "-",
            enable3DButton
        ];

        return tools;
    },
    
    /** private: method[save]
     *
     * Saves the map config and displays the URL in a window.
     */ 
    save: function(callback, scope) {
        var configStr = Ext.util.JSON.encode(this.getState());
        var method, url;
        if (this.id) {
            method = "PUT";
            url = "maps/" + this.id;
        } else {
            method = "POST";
            url = "maps";
        }
        OpenLayers.Request.issue({
            method: method,
            url: url,
            data: configStr,
            callback: function(request) {
                this.handleSave(request);
                if (callback) {
                    callback.call(scope || this);
                }
            },
            scope: this
        });
    },
        
    /** private: method[handleSave]
     *  :arg: ``XMLHttpRequest``
     */
    handleSave: function(request) {
        if (request.status == 200) {
            var config = Ext.util.JSON.decode(request.responseText);
            var mapId = config.id;
            if (mapId) {
                this.id = mapId;
                window.location.hash = "#maps/" + mapId;
            }
        } else {
            throw this.saveErrorText + request.responseText;
        }
    },
    
    /** private: method[showUrl]
     */
    showUrl: function() {
        var win = new Ext.Window({
            title: this.bookmarkText,
            layout: 'form',
            labelAlign: 'top',
            modal: true,
            bodyStyle: "padding: 5px",
            width: 300,
            items: [{
                xtype: 'textfield',
                fieldLabel: this.permakinkText,
                readOnly: true,
                anchor: "100%",
                selectOnFocus: true,
                value: window.location.href
            }]
        });
        win.show();
        win.items.first().selectText();
    },
    
    /** api: method[getBookmark]
     *  :return: ``String``
     *
     *  Generate a bookmark for an unsaved map.
     */
    getBookmark: function() {
        var params = Ext.apply(
            OpenLayers.Util.getParameters(),
            {q: Ext.util.JSON.encode(this.getState())}
        );
        
        // disregard any hash in the url, but maintain all other components
        var url = 
            document.location.href.split("?").shift() +
            "?" + Ext.urlEncode(params);
        
        return url;
    },

    /** private: method[displayAppInfo]
     * Display an informational dialog about the application.
     */
    displayAppInfo: function() {
        var appInfo = new Ext.Panel({
            title: this.appInfoText,
            html: "<iframe style='border: none; height: 100%; width: 100%' src='about.html' frameborder='0' border='0'><a target='_blank' href='about.html'>"+this.aboutText+"</a> </iframe>"
        });

        var about = Ext.applyIf(this.about, {
            title: '', 
            "abstract": '', 
            contact: ''
        });

        var mapInfo = new Ext.Panel({
            title: this.mapInfoText,
            html: '<div class="gx-info-panel">' +
                  '<h2>'+this.titleText+'</h2><p>' + about.title +
                  '</p><h2>'+this.descriptionText+'</h2><p>' + about['abstract'] +
                  '</p> <h2>'+this.contactText+'</h2><p>' + about.contact +'</p></div>',
            height: 'auto',
            width: 'auto'
        });

        var tabs = new Ext.TabPanel({
            activeTab: 0,
            items: [mapInfo, appInfo]
        });

        var win = new Ext.Window({
            title: this.aboutThisMapText,
            modal: true,
            layout: "fit",
            width: 300,
            height: 300,
            items: [tabs]
        });
        win.show();
    }
});

