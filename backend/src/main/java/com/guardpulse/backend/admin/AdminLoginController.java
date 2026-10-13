package com.guardpulse.backend.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Renders the admin login form at GET /admin/login. The POST to this same URL is handled
 * entirely by Spring Security's form-login filter (see SecurityConfig) — this controller's
 * only job is to serve the page itself, which nothing was doing before.
 */
@Controller
@RequestMapping("/admin")
public class AdminLoginController {

    @GetMapping("/login")
    public String login() {
        return "admin/login";
    }
}