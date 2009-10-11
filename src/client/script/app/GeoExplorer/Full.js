/**
 * Copyright (c) 2009 OpenGeo
 */

/*
 * @include GeoExplorer/Wizard.js
 */ 

/**
 * api: (define)
 * module = GeoExplorer
 * class = GeoExplorer.Full(config)
 * extends = GeoExplorer
 */

/** api: constructor
 *  .. class:: GeoExplorer.Full(config)
 *
 *      Create a GeoExplorer application intended for full-screen display.
 */
GeoExplorer.Full = Ext.extend(GeoExplorer, {
    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        var tools = GeoExplorer.Full.superclass.createTools.apply(this, arguments);

        var aboutButton = new Ext.Button({
            text: "GeoExplorer",
            iconCls: "icon-geoexplorer",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.unshift("-");
        tools.unshift(new Ext.Button({
            tooltip: "Publish Map",
            handler: function() {
                this.save(this.showEmbedWindow);
            },
            scope: this,
            iconCls: 'icon-export'
        }));
        tools.unshift(new Ext.Button({
            tooltip: "Save Map",
            handler: function() {
                this.save(this.showUrl);
            },
            scope: this,
            iconCls: "icon-save"
        }));
        tools.unshift("-");
        tools.unshift(aboutButton);
        return tools;
    },

    /** private: method[showEmbedWindow]
     */
    showEmbedWindow: function() {

        var snippetArea = new Ext.form.TextArea({
            height: 70,
            width: "100%",
            selectOnFocus: true,
            enableKeyEvents: true,
            listeners: {
                keypress: function(area, evt) {
                    evt.stopEvent();
                }
            }
        });
 
        var heightField = new Ext.form.NumberField({width: 50, value: 400});
        var widthField = new Ext.form.NumberField({width: 50, value: 600});
        
        // TODO: Get rid of embed.html
        var obj = OpenLayers.Util.createUrlObject("embed.html");
        var port = (obj.port === "80") ? "" : ":" + obj.port;
        var url = obj.protocol + "//" + obj.host + port + obj.pathname + "#maps/" + this.id;

        var updateSnippet = function() {
            snippetArea.setValue(
                '<iframe height="' + heightField.getValue() +
                ' " width="' + widthField.getValue() + '" src="' + url + '"> </iframe>'
            );
        };

        heightField.on("change", updateSnippet);
        widthField.on("change", updateSnippet);

        var snippet = new Ext.Panel({
            border: false,
            layout: 'fit',
            cls: 'gx-snippet-area',
            items: [snippetArea]
        });

        var adjustments = new Ext.Panel({
            layout: "column",
            defaults: {border: false},
            items: [
                {cls: "gx-field-label", html: "Map Size"},
                new Ext.form.ComboBox({
                    editable: false,
                    width: 70,
                    store: new Ext.data.SimpleStore({
                        fields: ["name", "height", "width"],
                        data: [
                            ["Mini", 100, 100],
                            ["Small", 200, 300],
                            ["Large", 400, 600]
                        ]
                    }),
                    triggerAction: 'all',
                    displayField: 'name',
                    value: "Large",
                    mode: 'local',
                    listeners: {
                        select: function(combo, record, index) {
                            widthField.setValue(record.get("width"));
                            heightField.setValue(record.get("height"));
                            updateSnippet();
                        }
                    }
                }),
                {cls: "gx-field-label", html: "Height", border: false},
                heightField,
                {cls: "gx-field-label", html: "Width", border: false},
                widthField
            ],
            border: false
        });

        var win = new Ext.Window({
            height: 180,
            width: 350,
            resizable: false,
            modal: true,
            title: "Export Map",
            items: [
                {html: "Your map is ready to be published to the web! Simply copy the following HTML to embed the map in your website:"}, 
                snippetArea, 
                adjustments
            ],
            listeners: {
                afterrender: updateSnippet
            }
        });
        win.show();
    }

});
