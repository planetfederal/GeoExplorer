
exports.Content = function (content, contentType) {
    return function (env) {
        return {
            status : 200,
            headers : { "Content-type": contentType || "text/html" },
            body : [content]
        };
    };
};

