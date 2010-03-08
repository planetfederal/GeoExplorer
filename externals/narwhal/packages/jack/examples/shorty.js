// a short url shortener. no persistance.
exports.app=function(e){return e.PATH_INFO!='/'?{status:301,headers:{'Location':d[e.PATH_INFO.substr(1)]},body:[]}:{status:200,headers:{'Content-Type':'text/html'},body:[e.QUERY_STRING?''+(d.push(decodeURIComponent(e.QUERY_STRING.substr(2)))-1):'<form><input name="u"/></form>']}};d=[]
