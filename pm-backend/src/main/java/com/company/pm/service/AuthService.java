package com.company.pm.service;

import com.company.pm.entity.*;
import com.company.pm.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepo;
    private final AdminRepository adminRepo;
    private final BCryptPasswordEncoder encoder;
    private final EmployeeSkillsRepository skillsRepo;
    private final SignupRequestRepository signupRequestRepo;

    public AuthService(EmployeeRepository employeeRepo, AdminRepository adminRepo,
                       BCryptPasswordEncoder encoder, EmployeeSkillsRepository skillsRepo,
                       SignupRequestRepository signupRequestRepo) {
        this.employeeRepo = employeeRepo;
        this.adminRepo = adminRepo;
        this.encoder = encoder;
        this.skillsRepo = skillsRepo;
        this.signupRequestRepo = signupRequestRepo;
    }

    public LoginResponse login(LoginRequest request) {
        String id = request.getId().trim();
        String password = request.getPassword().trim();

        // Admin login — plain text password, no BCrypt
        if (id.startsWith("AD")) {
            Admin admin = adminRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
            if (!password.equals(admin.getPassword())) {
                throw new RuntimeException("Invalid Credentials");
            }
            return new LoginResponse(admin.getId(), admin.getName(), "Administrator");
        }

        // Fall back to employees table
        Employee emp = employeeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found. Please check User ID"));

        if (!encoder.matches(password, emp.getPassword())) {
            throw new RuntimeException("Invalid Credentials");
        }

        return new LoginResponse(emp.getId(), emp.getName(), emp.getDesignation());
    }

    /** Check if an ID is already taken (employees, admins, or pending requests). */
    public Map<String, Object> checkId(String id) {
        if (id.startsWith("AD")) {
            return Map.of("available", false, "message", "ID already exists, please create a unique one");
        }
        boolean taken = employeeRepo.existsById(id)
                     || signupRequestRepo.existsById(id);
        if (taken) {
            return Map.of("available", false, "message", "ID already exists, please create a unique one");
        }
        return Map.of("available", true, "message", "Great! It's unique");
    }

    /** Submit signup as PENDING — does NOT create the employee yet. */
    public Map<String, String> signup(SignupRequest request, String documentFilename) {
        if (employeeRepo.existsById(request.getId()) || request.getId().startsWith("AD")) {
            throw new RuntimeException("ID already exists, please create a unique one");
        }
        if (signupRequestRepo.existsById(request.getId())) {
            throw new RuntimeException("A signup request with this ID is already pending approval");
        }

        String passwordRegex = "^(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{5,}$";
        if (!Pattern.matches(passwordRegex, request.getPassword())) {
            throw new RuntimeException("Password must have 1 capital letter, 1 special character and min length 5");
        }

        SignupRequestEntity pending = new SignupRequestEntity();
        pending.setId(request.getId());
        pending.setName(request.getName());
        pending.setPassword(encoder.encode(request.getPassword()));
        pending.setDesignation(request.getDesignation());
        pending.setSkills(request.getSkills());
        pending.setStatus("PENDING");
        pending.setDocumentPath(documentFilename);
        pending.setEmail(request.getEmail());
        signupRequestRepo.save(pending);

        return Map.of("message", "Signup request submitted. Awaiting admin approval.");
    }

    /** Get the document filename for a pending request. */
    public String getDocumentPath(String empId) {
        return signupRequestRepo.findById(empId)
            .map(SignupRequestEntity::getDocumentPath)
            .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    /** Admin: get all PENDING signup requests. */
    public List<SignupRequestEntity> getPendingSignups() {
        List<SignupRequestEntity> list = signupRequestRepo.findPendingRequests();
        System.out.println(">>> Pending signup requests found: " + list.size());
        list.forEach(r -> System.out.println("  - " + r.getId() + " | " + r.getName() + " | " + r.getStatus()));
        return list;
    }

    /** Admin: approve — creates employee then deletes the request. */
    public Map<String, String> approveSignup(String empId, String adminId) {
        SignupRequestEntity req = signupRequestRepo.findById(empId)
            .orElseThrow(() -> new RuntimeException("Signup request not found"));

        // Create the employee directly
        Employee emp = new Employee();
        emp.setId(req.getId());
        emp.setName(req.getName());
        emp.setPassword(req.getPassword());
        emp.setDesignation(req.getDesignation());
        emp.setStatus("BENCH");
        emp.setEmail(req.getEmail());
        employeeRepo.save(emp);

        // Save skills
        if (req.getSkills() != null && !req.getSkills().isBlank()) {
            for (String skill : req.getSkills().split("[,\\n]+")) {
                String trimmed = skill.trim();
                if (!trimmed.isEmpty()) {
                    EmployeeSkill es = new EmployeeSkill();
                    es.setEmpId(emp.getId());
                    es.setSkill(trimmed);
                    skillsRepo.save(es);
                }
            }
        }

        // Delete the request — no intermediate UPDATE to avoid FK lock
        signupRequestRepo.deleteById(empId);
        return Map.of("message", "Employee " + empId + " approved and account created.");
    }

    /** Admin: reject — removes the request. */
    public Map<String, String> rejectSignup(String empId) {
        signupRequestRepo.deleteById(empId);
        return Map.of("message", "Signup request for " + empId + " rejected.");
    }
}
