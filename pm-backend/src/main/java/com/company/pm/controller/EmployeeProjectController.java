package com.company.pm.controller;

import com.company.pm.entity.Project;
import com.company.pm.service.ProjectService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/employee")
@CrossOrigin(origins = {"http://localhost:4200","http://127.0.0.1:4200"})
public class EmployeeProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping("/{empId}/allotted")
    public List<Project> getAllottedProjects(@PathVariable String empId) {
        return projectService.getProjectsAllottedForEmployee(empId);
    }

    @GetMapping("/{empId}/current")
    public List<Project> getCurrentProjects(@PathVariable String empId) {
        return projectService.getProjectsCurrentForEmployee(empId);
    }

    @PostMapping("/accept-project")
    public ResponseEntity<String> acceptProject(@RequestBody Map<String, String> body) {
        String empId = body.get("empId");
        String projectId = body.get("projectId");

        if (empId == null || empId.isBlank() || projectId == null || projectId.isBlank()) {
            return ResponseEntity.badRequest().body("empId and projectId are required");
        }

        projectService.acceptProject(projectId, empId);
        return ResponseEntity.ok("Project accepted");
    }
}




