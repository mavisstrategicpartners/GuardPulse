package com.guardpulse.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import java.security.SecureRandom;
import java.util.Base64;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String configuredAdminPassword;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        String password = resolveAdminPassword();
        return new InMemoryUserDetailsManager(
                User.withUsername(adminUsername)
                        .password(encoder.encode(password))
                        .roles("ADMIN")
                        .build()
        );
    }

    /**
     * If ADMIN_PASSWORD wasn't set, generate a random one instead of falling back to any fixed
     * default — a fixed default is a real credential that ends up in git history, screenshots,
     * and eventually Shodan. The generated password only lives in memory and this log line, so
     * it changes every restart; that's fine for kicking the tyres, but set ADMIN_PASSWORD for
     * real use so you don't get locked out on redeploy.
     */
    private String resolveAdminPassword() {
        if (configuredAdminPassword != null && !configuredAdminPassword.isBlank()) {
            return configuredAdminPassword;
        }
        byte[] randomBytes = new byte[18];
        new SecureRandom().nextBytes(randomBytes);
        String generated = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        log.warn("=================================================================");
        log.warn(" No ADMIN_PASSWORD set — generated a random one for this session:");
        log.warn("   username: {}", adminUsername);
        log.warn("   password: {}", generated);
        log.warn(" It will change on every restart. Set ADMIN_PASSWORD to fix it.");
        log.warn("=================================================================");
        return generated;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/h2-console/**")) // JSON API is stateless; H2 console is dev-only
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())) // H2 console renders in a frame
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()
                .requestMatchers("/media/**").permitAll()
                .requestMatchers("/products/**").permitAll()
                .requestMatchers("/h2-console/**").hasRole("ADMIN") // dev-only, and off by default (see H2_CONSOLE_ENABLED)
                .requestMatchers("/admin/login").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            )
            .formLogin(form -> form
                .loginPage("/admin/login")
                .loginProcessingUrl("/admin/login")
                .defaultSuccessUrl("/admin/", true)
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/admin/logout")
                .logoutSuccessUrl("/admin/login?logout")
            );
        return http.build();
    }
}