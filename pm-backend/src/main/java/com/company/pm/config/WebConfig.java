package com.company.pm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

public class WebConfig implements WebMvcConfigurer{
    // @Override
    // public void addCorsMappings(CorsRegistry registry) {
    //     registry.addMapping("/**")
    //             .allowedOrigins("https://workflow-frontend-fabj.onrender.com") // PASTE YOUR FRONTEND URL HERE
    //             .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    //             .allowedHeaders("*")
    //             .allowCredentials(true);
    // }
}
