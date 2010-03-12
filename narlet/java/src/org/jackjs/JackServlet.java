package org.jackjs;
import java.io.IOException;
import javax.servlet.http.*;
import javax.servlet.*;

import java.io.*;

import org.mozilla.javascript.*;

@SuppressWarnings("serial")
public class JackServlet extends HttpServlet {
    private Scriptable scope;
    private Function require;

    private Function app;
    private Function handler;

    protected Object narwhalRequire(Context context, String id) {
        Object args[] = { Context.javaToJS(id, scope) };
        return require.call(context, scope, scope, args);
    }

    public void init(ServletConfig config) throws ServletException {
        super.init(config);

        final String modulesPath = getInitParam(config, "modulesPath", "WEB-INF");
        final String moduleName = getInitParam(config, "module", "jackconfig.js");
        final String appName = getInitParam(config, "app", "app");
        final String environmentName = getInitParam(config, "environment", null);
        final int optimizationLevel = Integer.parseInt(getInitParam(config, "optimizationLevel", "9"));

        final String modulePath = getServletContext().getRealPath(modulesPath+"/"+moduleName);
        final String narwhalHome = getServletContext().getRealPath("WEB-INF/narwhal");
        final String narwhalEngineHome = getServletContext().getRealPath("WEB-INF/narwhal/engines/rhino");
        final String narwhalBootstrap = getServletContext().getRealPath("WEB-INF/narwhal/engines/rhino/bootstrap.js");

        Context context = Context.enter();
        try {
            context.setOptimizationLevel(optimizationLevel);
            scope = new ImporterTopLevel(context);

            ScriptableObject.putProperty(scope, "NARWHAL_HOME",  Context.javaToJS(narwhalHome, scope));
            ScriptableObject.putProperty(scope, "NARWHAL_ENGINE_HOME",  Context.javaToJS(narwhalEngineHome, scope));

            // load Narwhal
            context.evaluateReader(scope, new FileReader(narwhalBootstrap), narwhalBootstrap, 1, null);

            // save the "require" function for use in "narwhalRequire()"
            require = (Function)ScriptableObject.getProperty(scope, "require");

            // load Servlet handler's "process" method
            Scriptable servletModule = (Scriptable)narwhalRequire(context, "jack/handler/servlet");
            Scriptable servletObject = (Scriptable)ScriptableObject.getProperty(servletModule, "Servlet");
            handler = (Function)ScriptableObject.getProperty(servletObject, "process");

            // load the app
            Scriptable module = (Scriptable)narwhalRequire(context, modulePath);
            app = (Function)ScriptableObject.getProperty(module, appName);

            if (environmentName != null) {
                Object environment = ScriptableObject.getProperty(module, environmentName);
                if (environment instanceof Function) {
                    Object args[] = { app };
                    app = (Function)((Function)environment).call(context, scope, module, args);
                } else {
                    System.err.println("Warning: environment named \"" + environmentName + "\" not found or not a function.");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            Context.exit();
        }
    }

    public void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Context context = Context.enter();
        try {
            Object args[] = { app, request, response };
            handler.call(context, scope, null, args);
        } finally {
            Context.exit();
        }
    }

    protected String getInitParam(ServletConfig config, String name, String defaultValue) {
        String value = config.getInitParameter(name);
        return value == null ? defaultValue : value;
    }
}
