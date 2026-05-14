package com.company.pm.controller;

import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.company.pm.entity.Project;
import com.company.pm.entity.WeeklyUpdate;
import com.company.pm.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = {"http://localhost:4200","http://127.0.0.1:4200"})
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;

    @SuppressWarnings("unchecked")
    @PostMapping("/create")
    public ResponseEntity<Project> createProject(@RequestBody Map<String, Object> payload) {
        Project project = new Project();
        project.setPrjId(UUID.randomUUID().toString());
        project.setName(payload.get("name") != null ? payload.get("name").toString() : null);
        project.setDescription(payload.get("description") != null ? payload.get("description").toString() : null);
        project.setTechStack(payload.get("techStack") != null ? payload.get("techStack").toString() : null);
        project.setManagerId(payload.get("managerId") != null ? payload.get("managerId").toString() : null);

        Object deadlineObj = payload.get("deadline");
        if (deadlineObj != null) {
            String deadlineStr = deadlineObj.toString().trim();
            if (!deadlineStr.isEmpty()) {
                try {
                    project.setDeadline(LocalDate.parse(deadlineStr));
                } catch (Exception ignored) { }
            }
        }

        List<String> empIds = null;
        Object empObj = payload.get("assignedEmployees");
        if (empObj instanceof List) {
            List<?> raw = (List<?>) empObj;
            empIds = new java.util.ArrayList<>();
            for (Object o : raw) {
                if (o != null && !o.toString().trim().isEmpty()) {
                    empIds.add(o.toString().trim());
                }
            }
        }

        return ResponseEntity.ok(projectService.createProject(project, empIds));
    }
    @PostMapping("/{prjId}/accept/{empId}")
    public ResponseEntity<String> acceptProject(@PathVariable String prjId, @PathVariable String empId) {
        projectService.acceptProject(prjId, empId);
        return ResponseEntity.ok("Project accepted");
    }
    @PostMapping("/{prjId}/weekly-update")
    public ResponseEntity<WeeklyUpdate> weeklyUpdate(
            @PathVariable String prjId,
            @RequestBody Map<String, Object> payload) {
        String empId = (String) payload.get("empId");
        String dateStr = (String) payload.get("date");
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : java.time.LocalDate.now();
        String workDone = (String) payload.get("workDone");
        if (workDone == null) workDone = (String) payload.get("work");
        Integer progress = payload.get("progress") != null ? (Integer) payload.get("progress") : 0;
        String statusStr = (String) payload.get("status");
        WeeklyUpdate.Status status = statusFromFrontend(statusStr);

        return ResponseEntity.ok(projectService.addWeeklyUpdate(prjId, empId, date, workDone, progress, status));
    }

    private static WeeklyUpdate.Status statusFromFrontend(String s) {
        if (s == null) return WeeklyUpdate.Status.ON_TRACK;
        switch (s) {
            case "At Risk": return WeeklyUpdate.Status.AT_RISK;
            case "Delayed": return WeeklyUpdate.Status.DELAYED;
            default: return WeeklyUpdate.Status.ON_TRACK;
        }
    }

    @GetMapping("/manager/{managerId}")
    public List<Project> getProjectsForManager(@PathVariable String managerId) {
        return projectService.getProjectsForManager(managerId);
    }

    @GetMapping("/manager/{managerId}/detail")
    public List<com.company.pm.entity.ProjectDetailDTO> getProjectsDetailForManager(@PathVariable String managerId) {
        return projectService.getProjectsDetailForManager(managerId);
    }

    @GetMapping("/employee/{empId}/allotted")
    public List<Project> getProjectsAllottedForEmployee(@PathVariable String empId) {
        return projectService.getProjectsAllottedForEmployee(empId);
    }

    @GetMapping("/employee/{empId}/current")
    public List<Project> getProjectsCurrentForEmployee(@PathVariable String empId) {
        return projectService.getProjectsCurrentForEmployee(empId);
    }

    @GetMapping("/{prjId}/weekly-logs/{empId}")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyLogsForEmployee(
            @PathVariable String prjId, @PathVariable String empId) {
        List<com.company.pm.entity.WeeklyUpdate> logs = 
            projectService.getWeeklyLogsForEmployee(prjId, empId);
        List<Map<String, Object>> result = logs.stream().map(w -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("date", w.getUpdateDate() != null ? w.getUpdateDate().toString() : null);
            m.put("work", w.getWorkDone());
            m.put("progress", w.getProgress());
            m.put("status", w.getStatus() != null ? w.getStatus().toString() : "ON_TRACK");
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(Map.of("message", "Project deleted"));
    } 
}
