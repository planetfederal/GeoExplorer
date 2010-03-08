/**
 * Session variables live throughout a user's session.
 *
 * HTTP is a stateless protocol for a *good* reason. Try to avoid using 
 * session variables. 
 */
var Session = exports.Session = function(env) {
    if (!env["jsgi.session"]) {
        try {
            env["jsgi.session"] = env["jsgi.session.loadSession"](env);
        } catch (err) {
            env["jsgi.session"] = {};
        }
    }
                
    return env["jsgi.session"];
}
