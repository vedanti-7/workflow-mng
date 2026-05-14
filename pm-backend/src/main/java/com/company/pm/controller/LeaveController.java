package com.company.pm.controller;

import com.company.pm.entity.LeaveApplication;
import com.company.pm.entity.ProjectEmployees;
import com.company.pm.repository.LeaveApplicationRepository;
import com.company.pm.repository.ProjectEmployeesRepository;
import com.company.pm.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class LeaveController {

    private static final String UPLOAD_DIR = "uploads/leave-docs/";

    @Autowired private LeaveApplicationRepository leaveRepo;
    @Autowired private ProjectEmployeesRepository projectEmpRepo;
    @Autowired private ProjectRepository projectRepo;

    // Employee: submit leave with document (multipart)
    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> applyLeaveWithManager(
            @RequestParam String empId,
            @RequestParam(required = false) String managerId,
            @RequestParam(required = false) String prjId,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam String reason,
            @RequestParam(defaultValue = "Casual") String leaveType,
            @RequestParam("document") MultipartFile document) throws IOException {

        if (empId == null || fromDate == null || toDate == null || reason == null)
            return ResponseEntity.badRequest().body("All fields required");

        if (document.isEmpty() || !document.getOriginalFilename().toLowerCase().endsWith(".pdf"))
            return ResponseEntity.badRequest().body("A valid PDF verification document is required");

        // Save PDF
        Files.createDirectories(Paths.get(UPLOAD_DIR));
        String filename = UUID.randomUUID() + "_" + empId + ".pdf";
        Files.copy(document.getInputStream(), Paths.get(UPLOAD_DIR + filename), StandardCopyOption.REPLACE_EXISTING);

        LocalDate from = LocalDate.parse(fromDate);
        int month = from.getMonthValue();
        int year = from.getYear();

        if ("WFH".equals(leaveType)) {
            long wfhCount = leaveRepo.countByEmpIdAndTypeAndMonth(empId, "WFH", month, year);
            if (wfhCount >= 8)
                return ResponseEntity.badRequest().body("WFH limit reached: max 8 days per month");
        } else {
            long yearlyCount = leaveRepo.countTotalLeavesInYear(empId, year);
            if (yearlyCount >= 60)
                return ResponseEntity.badRequest().body("Yearly leave limit reached: max 60 days per year");

            long monthlyTotal = leaveRepo.countTotalLeavesInMonth(empId, month, year);
            if (monthlyTotal >= 5)
                return ResponseEntity.badRequest().body("Monthly leave limit reached: max 5 leaves per month");

            Map<String, Integer> typeLimits = Map.of("Sick", 2, "Casual", 2, "Emergency", 1);
            int typeLimit = typeLimits.getOrDefault(leaveType, 2);
            long typeCount = leaveRepo.countByEmpIdAndTypeAndMonth(empId, leaveType, month, year);
            if (typeCount >= typeLimit)
                return ResponseEntity.badRequest().body(leaveType + " leave limit reached: max " + typeLimit + " per month");
        }

        LeaveApplication leave = new LeaveApplication();
        leave.setId(UUID.randomUUID().toString());
        leave.setEmpId(empId);
        leave.setManagerId(managerId);
        leave.setPrjId(prjId);
        leave.setFromDate(from);
        leave.setToDate(LocalDate.parse(toDate));
        leave.setReason(reason);
        leave.setLeaveType(leaveType);
        leave.setStatus(LeaveApplication.Status.Pending);
        leave.setNotificationExpiresAt(LocalDateTime.now().plusDays(3));
        leave.setDocumentPath(filename);

        leaveRepo.save(leave);
        return ResponseEntity.ok(leave);
    }

    // Manager: view leave verification document
    @GetMapping("/{leaveId}/document")
    public ResponseEntity<Resource> getDocument(@PathVariable String leaveId) throws MalformedURLException {
        LeaveApplication leave = leaveRepo.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave not found"));

        if (leave.getDocumentPath() == null)
            return ResponseEntity.notFound().build();

        Path file = Paths.get(UPLOAD_DIR + leave.getDocumentPath());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists())
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + leave.getDocumentPath() + "\"")
            .body(resource);
    }

    // Employee: get leave balance
    @GetMapping("/balance/{empId}")
    public ResponseEntity<Map<String, Object>> getLeaveBalance(@PathVariable String empId) {
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();

        long sick = leaveRepo.countByEmpIdAndTypeAndMonth(empId, "Sick", month, year);
        long casual = leaveRepo.countByEmpIdAndTypeAndMonth(empId, "Casual", month, year);
        long emergency = leaveRepo.countByEmpIdAndTypeAndMonth(empId, "Emergency", month, year);
        long wfh = leaveRepo.countByEmpIdAndTypeAndMonth(empId, "WFH", month, year);
        long yearlyUsed = leaveRepo.countTotalLeavesInYear(empId, year);

        Map<String, Object> balance = new java.util.LinkedHashMap<>();
        balance.put("sick", Map.of("used", sick, "max", 2));
        balance.put("casual", Map.of("used", casual, "max", 2));
        balance.put("emergency", Map.of("used", emergency, "max", 1));
        balance.put("wfh", Map.of("used", wfh, "max", 8));
        balance.put("monthlyTotal", Map.of("used", sick + casual + emergency, "max", 5));
        balance.put("yearlyTotal", Map.of("used", yearlyUsed, "max", 60));
        return ResponseEntity.ok(balance);
    }

    // Manager: get pending leaves
    @GetMapping("/manager/{managerId}/pending")
    public List<LeaveApplication> getPendingLeaves(@PathVariable String managerId) {
        return leaveRepo.findByManagerIdAndStatus(managerId, LeaveApplication.Status.Pending);
    }

    // Employee: get this month's leave history
    @GetMapping("/employee/{empId}/monthly")
    public List<LeaveApplication> getMonthlyLeaves(@PathVariable String empId) {
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        return leaveRepo.findByEmpIdAndMonth(empId, month, year);
    }

    // Employee: get their own leaves
    @GetMapping("/employee/{empId}")
    public List<LeaveApplication> getEmployeeLeaves(@PathVariable String empId) {
        return leaveRepo.findByEmpId(empId);
    }

    // Manager: approve or reject
    @PostMapping("/{leaveId}/decision")
    public ResponseEntity<?> decide(
            @PathVariable String leaveId,
            @RequestBody Map<String, String> body) {
        String decision = body.get("status");
        LeaveApplication leave = leaveRepo.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave not found"));

        leave.setStatus(LeaveApplication.Status.valueOf(decision));
        leave.setDecisionAt(LocalDateTime.now());
        leave.setNotificationExpiresAt(LocalDateTime.now().plusDays(1));
        leaveRepo.save(leave);
        return ResponseEntity.ok("Decision saved");
    }
}
