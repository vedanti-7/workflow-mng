package com.company.pm.service;

import com.company.pm.entity.Employee;
import com.company.pm.repository.EmployeeRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PasswordResetService {

    private final EmployeeRepository employeeRepo;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder encoder;

    public PasswordResetService(EmployeeRepository employeeRepo,
                                JavaMailSender mailSender,
                                BCryptPasswordEncoder encoder) {
        this.employeeRepo = employeeRepo;
        this.mailSender = mailSender;
        this.encoder = encoder;
    }

    /** Step 1: user submits their email — send reset link if found. */
    public Map<String, String> requestReset(String email) {
        String trimmed = email.trim();

        // Find employee by email
        java.util.Optional<Employee> found = employeeRepo.findByEmail(trimmed);

        if (found.isEmpty()) {
            return Map.of("message", "No account found with that email address.");
        }

        Employee emp = found.get();

        String token = UUID.randomUUID().toString();
        emp.setResetToken(token);
        emp.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        employeeRepo.save(emp);

        String resetLink = "http://localhost:4200/reset-password?token=" + token;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(trimmed);
        msg.setSubject("WorkFlow — Password Reset Request");
        msg.setText(
            "Hi " + emp.getName() + ",\n\n" +
            "You requested a password reset for your WorkFlow account (" + emp.getId() + ").\n\n" +
            "Click the link below to reset your password (valid for 30 minutes):\n" +
            resetLink + "\n\n" +
            "If you did not request this, ignore this email.\n\n" +
            "— WorkFlow Team"
        ); 
        mailSender.send(msg);

        return Map.of("message", "Reset link sent to " + trimmed + ". Check your inbox.");
    }

    /** Step 2: user submits token + new password. */
    public Map<String, String> resetPassword(String token, String newPassword) {
        Employee emp = employeeRepo.findByResetToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));

        if (emp.getResetTokenExpiry() == null || emp.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset link has expired. Please request a new one.");
        }

        String passwordRegex = "^(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{5,}$";
        if (!Pattern.matches(passwordRegex, newPassword)) {
            throw new RuntimeException("Password must have 1 capital letter, 1 special character and min length 5");
        }

        emp.setPassword(encoder.encode(newPassword));
        emp.setResetToken(null);
        emp.setResetTokenExpiry(null);
        employeeRepo.save(emp);

        return Map.of("message", "Password reset successfully. You can now log in.");
    }
}


