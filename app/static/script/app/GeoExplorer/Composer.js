/**
 * Copyright (c) 2009-2010 The Open Planning Project
 *
 * @requires GeoExplorer.js
 */

/** api: (define)
 *  module = GeoExplorer
 *  class = GeoExplorer.Composer(config)
 *  extends = GeoExplorer
 */

/** api: constructor
 *  .. class:: GeoExplorer.Composer(config)
 *
 *      Create a GeoExplorer application intended for full-screen display.
 */
GeoExplorer.Composer = Ext.extend(GeoExplorer, {

    /** api: config[cookieParamName]
     *  ``String`` The name of the cookie parameter to use for storing the
     *  logged in user.
     */
    cookieParamName: 'geoexplorer-user',

    // Begin i18n.
    saveMapText: "Save Map",
    exportMapText: "Publish Map",
    toolsTitle: "Choose tools to include in the toolbar:",
    previewText: "Preview",
    backText: "Back",
    nextText: "Next",
    loginText: "Login",
    logoutText: "Logout, {user}",
    loginErrorText: "Invalid username or password.",
    userFieldText: "User",
    passwordFieldText: "Password", 
    saveErrorText: "Trouble saving: ",
    // End i18n.

    constructor: function(config) {
        if (config.authStatus === 401) {
            // user has not authenticated or is not authorized
            this.authorizedRoles = [];
        } else {
            // user has authenticated or auth back-end is not available
            this.authorizedRoles = ["ROLE_ADMINISTRATOR"];
        }
        // should not be persisted or accessed again
        delete config.authStatus;

        config.tools = [
            {
                ptype: "gxp_layermanager",
                outputConfig: {
                    id: "layers",
                    autoScroll: true,
                    tbar: []
                },
                outputTarget: "tree"
            }, {
                ptype: "gxp_addlayers",
                actionTarget: "layers.tbar",
                upload: true
            }, {
                ptype: "gxp_removelayer",
                actionTarget: ["layers.tbar", "layers.contextMenu"]
            }, {
                ptype: "gxp_layerproperties",
                actionTarget: ["layers.tbar", "layers.contextMenu"]
            }, {
                ptype: "gxp_styler",
                actionTarget: ["layers.tbar", "layers.contextMenu"]
            }, {
                ptype: "gxp_zoomtolayerextent",
                actionTarget: {target: "layers.contextMenu", index: 0}
            }, {
                ptype: "gxp_navigation", toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 6}
            }, {
                ptype: "gxp_wmsgetfeatureinfo", format: 'grid', toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 7}
            }, {
                ptype: "gxp_featuremanager",
                id: "featuremanager",
                maxFeatures: 20,
                paging: false
            }, {
                ptype: "gxp_featureeditor",
                featureManager: "featuremanager",
                autoLoadFeature: true,
                toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 8}
            }, {
                ptype: "gxp_measure", toggleGroup: this.toggleGroup,
                controlOptions: {immediate: true},
                actionTarget: {target: "paneltbar", index: 10}
            }, {
                ptype: "gxp_zoom",
                actionTarget: {target: "paneltbar", index: 11}
            }, {
                ptype: "gxp_navigationhistory",
                actionTarget: {target: "paneltbar", index: 13}
            }, {
                ptype: "gxp_zoomtoextent",
                actionTarget: {target: "paneltbar", index: 15}
            }, {
                ptype: "gxp_print",
                customParams: {outputFilename: 'GeoExplorer-print'},
                printService: config.printService,
                actionTarget: {target: "paneltbar", index: 5}
            }, {
                ptype: "gxp_googleearth",
                actionTarget: {target: "paneltbar", index: 17},
            }
        ];
        
        GeoExplorer.Composer.superclass.constructor.apply(this, arguments);
    },

    /** api: method[destroy]
     */
    destroy: function() {
        this.loginButton = null;
        GeoExplorer.Composer.superclass.destroy.apply(this, arguments);
    },

    /** private: method[setCookieValue]
     *  Set the value for a cookie parameter
     */
    setCookieValue: function(param, value) {
        document.cookie = param + '=' + escape(value);
    },

    /** private: method[clearCookieValue]
     *  Clear a certain cookie parameter.
     */
    clearCookieValue: function(param) {
        document.cookie = param + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    },

    /** private: method[getCookieValue]
     *  Get the value of a certain cookie parameter. Returns null if not found.
     */
    getCookieValue: function(param) {
        var i, x, y, cookies = document.cookie.split(";");
        for (i=0; i < cookies.length; i++) {
            x = cookies[i].substr(0, cookies[i].indexOf("="));
            y = cookies[i].substr(cookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==param) {
                return unescape(y);
            }
        }
        return null;
    },

    /** private: method[logout]
     *  Log out the current user from the application.
     */
    logout: function() {
        this.clearCookieValue("JSESSIONID");
        this.clearCookieValue(this.cookieParamName);
        this.setAuthorizedRoles([]);
        Ext.getCmp('paneltbar').items.each(function(tool) {
            if (tool.needsAuthorization === true) {
                tool.disable();
            }
        });
        this.showLogin();
    },

    /** private: method[showLoginDialog]
     * Show the login dialog for the user to login.
     */
    showLoginDialog: function() {
        var panel = new Ext.FormPanel({
            url: "../login/",
            frame: true,
            labelWidth: 60,
            defaultType: "textfield",
            errorReader: {
                read: function(response) {
                    var success = false;
                    var records = [];
                    if (response.status === 200) {
                        success = true;
                    } else {
                        records = [
                            {data: {id: "username", msg: this.loginErrorText}},
                            {data: {id: "password", msg: this.loginErrorText}}
                        ];
                    }
                    return {
                        success: success,
                        records: records
                    };
                }
            },
            items: [{
                fieldLabel: this.userFieldText,
                name: "username",
                allowBlank: false
            }, {
                fieldLabel: this.passwordFieldText,
                name: "password",
                inputType: "password",
                allowBlank: false
            }],
            buttons: [{
                text: this.loginText,
                formBind: true,
                handler: submitLogin,
                scope: this
            }],
            keys: [{ 
                key: [Ext.EventObject.ENTER], 
                handler: submitLogin,
                scope: this
            }]
        });

        function submitLogin() {
            panel.buttons[0].disable();
            panel.getForm().submit({
                success: function(form, action) {
                    this.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
                    Ext.getCmp('paneltbar').items.each(function(tool) {
                        if (tool.needsAuthorization === true) {
                            tool.enable();
                        }
                    });
                    var user = form.findField('username').getValue();
                    this.setCookieValue(this.cookieParamName, user);
                    this.showLogout(user);
                    win.close();
                },
                failure: function(form, action) {
                    this.authorizedRoles = [];
                    panel.buttons[0].enable();
                    form.markInvalid({
                        "username": this.loginErrorText,
                        "password": this.loginErrorText
                    });
                },
                scope: this
            });
        }
                
        var win = new Ext.Window({
            title: this.loginText,
            layout: "fit",
            width: 235,
            height: 130,
            plain: true,
            border: false,
            modal: true,
            items: [panel]
        });
        win.show();
    },

    /**
     * private: method[applyLoginState]
     * Attach a handler to the login button and set its text.
     */
    applyLoginState: function(iconCls, text, handler, scope) {
        this.loginButton.setIconClass(iconCls);
        this.loginButton.setText(text);
        this.loginButton.setHandler(handler, scope);
    },

    /** private: method[showLogin]
     *  Show the login button.
     */
    showLogin: function() {
        var text = this.loginText;
        var handler = this.showLoginDialog;
        this.applyLoginState('login', text, handler, this);
    },

    /** private: method[showLogout]
     *  Show the logout button.
     */
    showLogout: function(user) {
        var text = new Ext.Template(this.logoutText).applyTemplate({user: user});
        var handler = this.logout;
        this.applyLoginState('logout', text, handler, this);
    },

    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        var tools = GeoExplorer.Composer.superclass.createTools.apply(this, arguments);

        this.loginButton = new Ext.Button();
        tools.push(['->', this.loginButton]);

        // unauthorized, show login button
        if (this.authorizedRoles.length === 0) {
            this.showLogin();
        } else {
            var user = this.getCookieValue(this.cookieParamName);
            if (user === null) {
                user = "unknown";
            }
            this.showLogout(user);
        }

        var aboutButton = new Ext.Button({
            text: this.appInfoText,
            iconCls: "icon-geoexplorer",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.unshift("-");
        tools.unshift(new Ext.Button({
            tooltip: this.exportMapText,
            needsAuthorization: true,
            disabled: !this.isAuthorized(),
            handler: function() {
                this.save(this.showEmbedWindow);
            },
            scope: this,
            iconCls: 'icon-export'
        }));
        tools.unshift(new Ext.Button({
            tooltip: this.saveMapText,
            needsAuthorization: true,
            disabled: !this.isAuthorized(),
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

    /** private: method[openPreview]
     */
    openPreview: function(embedMap) {
        var preview = new Ext.Window({
            title: this.previewText,
            layout: "fit",
            resizable: false,
            items: [{border: false, html: embedMap.getIframeHTML()}]
        });
        preview.show();
        var body = preview.items.get(0).body;
        var iframe = body.dom.firstChild;
        var loading = new Ext.LoadMask(body);
        loading.show();
        Ext.get(iframe).on('load', function() { loading.hide(); });
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
            url = "../maps/" + this.id;
        } else {
            method = "POST";
            url = "../maps/";
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

    /** private: method[showEmbedWindow]
     */
    showEmbedWindow: function() {
       var toolsArea = new Ext.tree.TreePanel({title: this.toolsTitle, 
           autoScroll: true,
           root: {
               nodeType: 'async', 
               expanded: true, 
               children: this.viewerTools
           }, 
           rootVisible: false,
           id: 'geobuilder-0'
       });

       var previousNext = function(incr){
           var l = Ext.getCmp('geobuilder-wizard-panel').getLayout();
           var i = l.activeItem.id.split('geobuilder-')[1];
           var next = parseInt(i, 10) + incr;
           l.setActiveItem(next);
           Ext.getCmp('wizard-prev').setDisabled(next==0);
           Ext.getCmp('wizard-next').setDisabled(next==1);
           if (incr == 1) {
               this.save();
           }
       };

       var embedMap = new gxp.EmbedMapDialog({
           id: 'geobuilder-1',
           url: "../viewer/#maps/" + this.id
       });

       var wizard = {
           id: 'geobuilder-wizard-panel',
           border: false,
           layout: 'card',
           activeItem: 0,
           defaults: {border: false, hideMode: 'offsets'},
           bbar: [{
               id: 'preview',
               text: this.previewText,
               handler: function() {
                   this.save(this.openPreview.createDelegate(this, [embedMap]));
               },
               scope: this
           }, '->', {
               id: 'wizard-prev',
               text: this.backText,
               handler: previousNext.createDelegate(this, [-1]),
               scope: this,
               disabled: true
           },{
               id: 'wizard-next',
               text: this.nextText,
               handler: previousNext.createDelegate(this, [1]),
               scope: this
           }],
           items: [toolsArea, embedMap]
       };

       new Ext.Window({
            layout: 'fit',
            width: 500, height: 300,
            title: this.exportMapText,
            items: [wizard]
       }).show();
    }

});
