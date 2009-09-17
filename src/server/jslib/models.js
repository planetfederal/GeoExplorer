Class({
    /**
     * Note that this goes against the constructor convention (capitalized and 
     * singular) but it makes for a more webby interface.  So, at the command 
     * line we have to suffer `new maps(...)` but through the web we can more
     * sensibly `GET /maps/1` and `POST /maps`.
     */
    id: "maps"
});
