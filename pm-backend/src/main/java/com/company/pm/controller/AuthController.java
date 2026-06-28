package com.company.pm.controller;

import com.company.pm.entity.*;
import com.company.pm.service.AuthService;
import com.company.pm.service.PasswordResetService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private static final String UPLOAD_DIR = "uploads/documents/";

    public AuthController(AuthService authService, PasswordResetService passwordResetService) throws IOException {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        Files.createDirectories(Paths.get(UPLOAD_DIR));
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String id) {
        return authService.checkId(id);
    }

    // ── Password Reset ────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestParam String email) {
        return passwordResetService.requestReset(email);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestParam String token,
                                              @RequestParam String newPassword) {
        return passwordResetService.resetPassword(token, newPassword);
    }

    /** Signup now accepts multipart/form-data to include the PDF document. */
    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> signup(
            @RequestParam String id, 
            @RequestParam String name,
            @RequestParam String password,
            @RequestParam String designation,
            @RequestParam(required = false) String skills,
            @RequestParam String email,
            @RequestParam("document") MultipartFile document) throws IOException {

        if (document.isEmpty() || !document.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("A valid PDF verification document is required");
        }

        String filename = UUID.randomUUID() + "_" + id + ".pdf";
        Path dest = Paths.get(UPLOAD_DIR + filename);
        Files.copy(document.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        SignupRequest req = new SignupRequest();
        req.setId(id);
        req.setName(name);
        req.setPassword(password);
        req.setDesignation(designation);
        req.setSkills(skills);
        req.setEmail(email);

        return authService.signup(req, filename);
    }

    /** Admin: download/view the verification document for a request. */
    @GetMapping("/admin/signup-requests/{empId}/document")
    public ResponseEntity<Resource> getDocument(@PathVariable String empId) throws MalformedURLException {
        String filename = authService.getDocumentPath(empId);
        Path file = Paths.get(UPLOAD_DIR + filename);
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .body(resource);
    }

    // ── Admin endpoints ──────────────────────────────────────────────────────

    @GetMapping("/admin/signup-requests")
    public List<SignupRequestEntity> getPendingSignups() {
        return authService.getPendingSignups();
    }

    @PostMapping("/admin/signup-requests/{empId}/approve")
    public Map<String, String> approveSignup(
            @PathVariable String empId,
            @RequestParam String adminId) {     
        return authService.approveSignup(empId, adminId);
    }

    @DeleteMapping("/admin/signup-requests/{empId}/reject")
    public Map<String, String> rejectSignup(@PathVariable String empId) {
        return authService.rejectSignup(empId);
    }
}
