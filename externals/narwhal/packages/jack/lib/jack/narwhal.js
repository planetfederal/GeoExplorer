var Request = require("./request").Request,
    Response = require("./response").Response;

exports.app = function(env) {
    var req = new Request(env),
        narwhal = "",
        href = "";

    if (req.GET("narwhals")) {
        narwhal = NARWHALS_FLASH;
    }
    else if (req.GET("flip") === "crash") {
        throw new Error("Narwhal crashed");
    }
    else if (req.GET("flip") === "left") {
        narwhal = NARWHAL_LEFT;
        href = "?flip=right";
    }
    else {
        narwhal = NARWHAL_RIGHT;
        href = "?flip=left";
    }

    var res = new Response();
    
    res.write("<title>Narwhalicious!</title>");
    res.write("<p><a href='"+href+"'>flip!</a></p>");
    res.write("<p><a href='?narwhals=YEAH'>more!</a></p>");
    res.write("<p><a href='?flip=crash'>crash!</a></p>");
    res.write("<pre>");
    res.write(narwhal);
    res.write("</pre>");

    return res.finish();
}

var NARWHAL_LEFT = "                                                     ,\n                                                  ,f\n                                               ,t,\n                                            ,:L.\n                                           tL,\n                        :EDDEKL         :Lt\n                      DDDDLGKKKK    ,,tD\n                   ,GDDfi.itLKKEKL tEi\n                 DDEEf,,tfLLDEEDL,D\n              .GEDEf,itLLfDLDLDDfD\n            DDEDLf,,fLLGLLDLDti:DL\n          DGDDGL,tttLDLDLfttttiLD\n         GDDLLt,fLLLDLLtLi,ttfLG\n        GGDGt,tLLLDfftii,i,ttLf\n       DGLLtttftftttf,,tttitLt\n      DEtftttLffttttii ttfLfj\n    .DLtittftLftt,,i,,itLfLj\n    DGL;t,tftiti,,,,,,tLLLt\n   DGGttttttii,,,,,:,tttDG\n  ,DLtjtiitii,,:,:,,t ,tG:\n  DDjttttt,ii,,,,:::t:ttL\n ;GLjtttti,i,,, ,,LG,,ft\n DDLttftttti;,,ifDLDtiit\n EGLjtjftt,,,ifLt  DLt,:\n DGfffijittfftt   .DLLt\n:DGfjffftfLft      EEDf\n:EGfftjjLLj         EED\n:DGfLfjLGG          ;E,\n GGfffLLL\n DGffLDf\n DGLfGL.\n fGLfGL\n  DGLDL\n  EGGGG\n   DLGG\n   EGLL\n    ELG\n    EEDKDGEE\n    jKEKKKK\n    EEKKKK\n    DEE\n  .EEKG\n   Lf";

var NARWHAL_RIGHT = ",\nf,\n  ,t,\n    .L:,\n      ,Lt\n         tL:         LKEDDE:\n            Dt,,    KKKKGLDDDD\n              iEt LKEKKLti.ifDDG,\n                 D,LDEEDLLft,,fEEDD\n                  DfDDLDLDfLLti,fEDEG.\n                  LD:itDLDLLGLLf,,fLDEDD\n                   DLittttfLDLDLttt,LGDDGD\n                    GLftt,iLtLLDLLLf,tLLDDG\n                     fLtt,i,iitffDLLLt,tGDGG\n                      tLtittt,,ftttftftttLLGD\n                       jfLftt iittttffLtttftED\n                        jLfLti,,i,,ttfLtfttitLD.\n                         tLLLt,,,,,,ititft,t;LGD\n                          GDttt,:,,,,,iittttttGGD\n                          :Gt, t,,:,:,,iitiitjtLD,\n                           Ltt:t:::,,,,ii,tttttjDD\n                            tf,,GL,, ,,,i,ittttjLG;\n                            tiitDLDfi,,;ittttfttLDD\n                            :,tLD  tLfi,,,ttfjtjLGE\n                             tLLD.   ttffttijifffGD\n                             fDEE      tfLftfffjfGD:\n                             DEE         jLLjjtffGE:\n                             ,E;          GGLjfLfGD:\n                                           LLLfffGG\n                                            fDLffGD\n                                            .LGfLGD\n                                             LGfLGf\n                                             LDLGD\n                                             GGGGE\n                                             GGLD\n                                             LLGE\n                                             GLE\n                                        EEGDKDEE\n                                         KKKKEKj\n                                          KKKKEE\n                                             EED\n                                             GKEE.\n                                               fL\n";

var NARWHALS_FLASH = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="640" height="360" id="manny1" align="middle"><param name="allowScriptAccess" value="sameDomain" /><param name="allowFullScreen" value="true" /><param name="movie" value="http://www.weebls-stuff.com/flash/426_narwhales2.swf" /><param name="quality" value="high" /><embed src="http://www.weebls-stuff.com/flash/426_narwhales2.swf" quality="high" width="640" height="360"  align="middle" allowScriptAccess="sameDomain" allowFullScreen="true" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" /></object>';
