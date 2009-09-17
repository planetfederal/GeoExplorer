(function() {

    var jsfiles = new Array(
        "GeoExplorer.js",
        "GeoExplorer/util.js",
        "GeoExplorer/Wizard.js",
        "GeoExplorer/CapabilitiesGrid.js",
        "GeoExplorer/Full.js",
        "GeoExplorer/Embed.js",
        "GeoExplorer/NewSourceWindow.js",
        "GeoExplorer/plugins/GoogleMaps.js"
    );

    var scripts = document.getElementsByTagName("script");
    var parts = scripts[scripts.length-1].src.split("/");
    parts.pop();
    var path = parts.join("/");

    var appendable = !(/MSIE/.test(navigator.userAgent) ||
                       /Safari/.test(navigator.userAgent));
    var pieces = new Array(jsfiles.length);

    var element = document.getElementsByTagName("head").length ?
                    document.getElementsByTagName("head")[0] :
                    document.body;
    var script, src;

    for(var i=0; i<jsfiles.length; i++) {
        src = path + "/" + jsfiles[i];
        if(!appendable) {
            pieces[i] = "<script src='" + src + "'></script>"; 
        } else {
            script = document.createElement("script");
            script.src = src;
            element.appendChild(script);
        }
    }
    if(!appendable) {
        document.write(pieces.join(""));
    }
})();
