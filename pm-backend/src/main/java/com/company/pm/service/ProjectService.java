package com.company.pm.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.pm.entity.Employee;
import com.company.pm.entity.Project;
import com.company.pm.entity.ProjectDetailDTO;
import com.company.pm.entity.ProjectEmployees;
import com.company.pm.entity.WeeklyUpdate;
import com.company.pm.repository.EmployeeRepository;
import com.company.pm.repository.ProjectEmployeesRepository;
import com.company.pm.repository.ProjectRepository;
import com.company.pm.repository.WeeklyUpdatesRepository;
import com.company.pm.repository.DailyTaskRepository;
import com.company.pm.repository.DailyTaskResponseRepository;
import com.company.pm.repository.LeaveApplicationRepository;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private EmployeeRepository employeeRepo;
    @Autowired
    private ProjectEmployeesRepository projectEmpRepo;
    @Autowired
    private WeeklyUpdatesRepository weeklyRepo;
    @Autowired
    private DailyTaskRepository dailyTaskRepo;
    @Autowired
    private DailyTaskResponseRepository dailyTaskResponseRepo;
    @Autowired
    private LeaveApplicationRepository leaveRepo;


    @Transactional
    public Project createProject(Project project, List<String> assignedEmpIds) {
        if (project.getStartDate() == null) {
            project.setStartDate(LocalDate.now());
        }
        if (project.getDeadline() == null) {
            project.setDeadline(project.getStartDate().plusMonths(1));
        }
        project.setStatus("Not Started");
        // Ensure required fields are not null for DB
        if (project.getName() == null) project.setName("");
        if (project.getDescription() == null) project.setDescription("");
        if (project.getTechStack() == null) project.setTechStack("");
        if (project.getManagerId() == null) project.setManagerId("");

        project = projectRepository.save(project);

        List<String> empIds = assignedEmpIds == null ? Collections.emptyList()
            : assignedEmpIds.stream()
                .filter(Objects::nonNull)
                .map(Object::toString)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        Set<String> missingEmployeeIds = new LinkedHashSet<>();

        for (String empId : empIds) {
            ProjectEmployees pe = new ProjectEmployees();
            pe.setPrjId(project.getPrjId());
            pe.setEmpId(empId);
            pe.setAccepted(false);
            projectEmpRepo.save(pe);

            Employee assignedEmp = employeeRepo.findById(empId).orElse(null);
            if (assignedEmp == null) {
                missingEmployeeIds.add(empId);
            } else {
                assignedEmp.setStatus("BILLABLE");
                employeeRepo.save(assignedEmp);
            }
        }

        // Manager who created the project is also Billable
        String managerId = project.getManagerId();
        if (managerId != null && !managerId.trim().isEmpty()) {
            Employee managerEmp = employeeRepo.findById(managerId.trim()).orElse(null);
            if (managerEmp == null) {
                missingEmployeeIds.add(managerId.trim());
            } else {
                managerEmp.setStatus("BILLABLE");
                employeeRepo.save(managerEmp);
            }
        }
        if (managerId != null && !managerId.trim().isEmpty() &&
            empIds.stream().noneMatch(id -> id.equals(managerId.trim()))) {
            
            ProjectEmployees managerPe = new ProjectEmployees();
            managerPe.setPrjId(project.getPrjId());
            managerPe.setEmpId(managerId.trim());
            managerPe.setAccepted(true);
            projectEmpRepo.save(managerPe);
        }
        if (!missingEmployeeIds.isEmpty()) {
            System.err.println(
                "Status update skipped for unknown employee IDs during project creation: "
                + String.join(", ", missingEmployeeIds)
            );
        }

        return project;
    }

    public void acceptProject(String prjId, String empId) {
        ProjectEmployees pe = projectEmpRepo.findByPrjIdAndEmpId(prjId, empId)
            .orElseThrow(() -> new RuntimeException("Assignment not found"));
        pe.setAccepted(true);
        projectEmpRepo.save(pe);
    }

    public WeeklyUpdate addWeeklyUpdate(String prjId, String empId, LocalDate date, String workDone,
            Integer progress, WeeklyUpdate.Status status) {
        // WeeklyUpdate update = new WeeklyUpdate();
        // update.setPrjId(prjId);
        // update.setEmpId(empId);
        // update.setUpdateDate(date);
        // update.setWorkDone(workDone != null ? workDone : "");
        // update.setProgress(progress != null ? progress : 0);
        // update.setStatus(status != null ? status : WeeklyUpdate.Status.ON_TRACK);
        // return weeklyRepo.save(update);
        ProjectEmployees pe = projectEmpRepo.findByPrjIdAndEmpId(prjId, empId)
        .orElseThrow(() -> new RuntimeException("Employee not assigned to project"));

        // Check if employee accepted the project
        if (!Boolean.TRUE.equals(pe.getAccepted())) {
            throw new RuntimeException("Project not accepted yet");
        }

        WeeklyUpdate update = new WeeklyUpdate();
        update.setPrjId(prjId);
        update.setEmpId(empId);
        update.setUpdateDate(date);
        update.setWorkDone(workDone != null ? workDone : "");
        update.setProgress(progress != null ? progress : 0);
        update.setStatus(status != null ? status : WeeklyUpdate.Status.ON_TRACK);

        return weeklyRepo.save(update);
    }

    public List<Project> getProjectsForManager(String managerId) {
        return projectRepository.findByManagerId(managerId);
    }

    /** Returns projects with assignedEmployees, acceptedBy, and updates for manager dashboard. */
    public List<ProjectDetailDTO> getProjectsDetailForManager(String managerId) {
        List<Project> projects = projectRepository.findByManagerId(managerId);
        List<ProjectDetailDTO> result = new ArrayList<>();
        for (Project p : projects) {
            ProjectDetailDTO dto = new ProjectDetailDTO();
            dto.setPrjId(p.getPrjId());
            dto.setName(p.getName());
            dto.setDescription(p.getDescription());
            dto.setTechStack(p.getTechStack());
            dto.setManagerId(p.getManagerId());
            dto.setStartDate(p.getStartDate());
            dto.setDeadline(p.getDeadline());
            dto.setStatus(p.getStatus());

            List<ProjectEmployees> assignments = projectEmpRepo.findByPrjId(p.getPrjId());
            List<String> assigned = assignments == null ? new ArrayList<>() : assignments.stream()
                .map(ProjectEmployees::getEmpId)
                .filter(id -> !id.equals(p.getManagerId()))
                .collect(Collectors.toList());
            List<String> accepted = assignments == null ? new ArrayList<>() : assignments.stream()
                .filter(pe -> Boolean.TRUE.equals(pe.getAccepted()) && !pe.getEmpId().equals(p.getManagerId()))
                .map(ProjectEmployees::getEmpId)
                .collect(Collectors.toList());
            dto.setAssignedEmployees(assigned);
            dto.setAcceptedBy(accepted);

            List<WeeklyUpdate> weeklyList = weeklyRepo.findByPrjIdOrderByUpdateDateDesc(p.getPrjId());
            if (weeklyList == null) weeklyList = new ArrayList<>();
            // Only show updates from last 2 days in the dashboard display
            final java.time.LocalDate twoDaysAgo = java.time.LocalDate.now().minusDays(2);
            List<ProjectDetailDTO.EmployeeUpdateDTO> updates = new ArrayList<>();
            for (String empId : assigned) {
                ProjectDetailDTO.EmployeeUpdateDTO empUpdate = new ProjectDetailDTO.EmployeeUpdateDTO();
                empUpdate.setEmployeeId(empId);
                List<ProjectDetailDTO.WeeklyLogDTO> logs = weeklyList.stream()
                    .filter(w -> w.getEmpId().equals(empId) && w.getUpdateDate() != null && !w.getUpdateDate().isBefore(twoDaysAgo))
                    .map(w -> {
                        ProjectDetailDTO.WeeklyLogDTO log = new ProjectDetailDTO.WeeklyLogDTO();
                        log.setDate(w.getUpdateDate() != null ? w.getUpdateDate().toString() : null);
                        log.setWork(w.getWorkDone());
                        log.setProgress(w.getProgress());
                        log.setStatus(statusToFrontend(w.getStatus()));
                        return log;
                    })
                    .collect(Collectors.toList());
                empUpdate.setWeeklyLogs(logs);
                updates.add(empUpdate);
            }
            dto.setUpdates(updates);
            result.add(dto);
        }
        return result;
    }

    private static String statusToFrontend(WeeklyUpdate.Status s) {
        if (s == null) return "On Track";
        switch (s) {
            case AT_RISK: return "At Risk";
            case DELAYED: return "Delayed";
            default: return "On Track";
        }
    }

    /** Projects allotted to employee (not yet accepted). */
    public List<Project> getProjectsAllottedForEmployee(String empId) {
        return projectEmpRepo.findByEmpIdAndAcceptedFalse(empId).stream()
            .map(pe -> projectRepository.findById(pe.getPrjId()).orElse(null))
            .filter(p -> p != null)
            .collect(Collectors.toList());
    }

    /** Projects employee has accepted (current). */
    public List<Project> getProjectsCurrentForEmployee(String empId) {
        return projectEmpRepo.findByEmpIdAndAcceptedTrue(empId).stream()
            .map(pe -> projectRepository.findById(pe.getPrjId()).orElse(null))
            .filter(p -> p != null)
            .collect(Collectors.toList());
    }

    public List<WeeklyUpdate> getWeeklyLogsForEmployee(String prjId, String empId) {
        return weeklyRepo.findByPrjIdOrderByUpdateDateDesc(prjId).stream()
            .filter(w -> empId.equals(w.getEmpId()))
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProject(String id) {
        dailyTaskResponseRepo.deleteByPrjId(id);
        dailyTaskRepo.deleteByPrjId(id);
        weeklyRepo.deleteByPrjId(id);
        projectEmpRepo.deleteByPrjId(id);
        leaveRepo.deleteByPrjId(id);               // leave applications referencing this project
        projectRepository.deleteById(id);
    }
}
