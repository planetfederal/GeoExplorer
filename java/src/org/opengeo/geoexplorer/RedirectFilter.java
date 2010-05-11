package org.opengeo.geoexplorer;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class RedirectFilter implements Filter {

    static Logger LOGGER = Logger.getLogger("org.opengeo.geoexplorer");
    
    public void init(FilterConfig config) throws ServletException {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        
        if (!(request instanceof HttpServletRequest)) {
            chain.doFilter(request, response);
            return;
        }
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        
        LOGGER.fine("PATH_INFO: " + req.getPathInfo());
        LOGGER.fine("REQUEST_URI: " + req.getRequestURI());
        
        if ("/".equals(req.getPathInfo())) {
            if (!req.getRequestURI().endsWith("/")) {
                
                // do a redirect
                String location = req.getScheme() + "://" + 
                req.getServerName() + ":" + req.getServerPort() + 
                req.getRequestURI() + "/";
                
                res.setStatus(301);
                res.setHeader("Location", location);
                
                return;
            }
        }
        
        chain.doFilter(request, response);
    }

    public void destroy() {
    }


}
