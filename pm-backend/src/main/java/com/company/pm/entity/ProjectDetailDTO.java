package com.company.pm.entity;

import java.time.LocalDate;
import java.util.List;

/**
 * Project with assigned/accepted employees and weekly updates for manager dashboard.
 */
public class ProjectDetailDTO {
    private String prjId;
    private String name;
    private String description;
    private String techStack;
    private String managerId;
    private LocalDate startDate;
    private LocalDate deadline;
    private String status;
    private List<String> assignedEmployees;
    private List<String> acceptedBy;
    private List<EmployeeUpdateDTO> updates;

    public String getPrjId() { return prjId; }
    public void setPrjId(String prjId) { this.prjId = prjId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getAssignedEmployees() { return assignedEmployees; }
    public void setAssignedEmployees(List<String> assignedEmployees) { this.assignedEmployees = assignedEmployees; }
    public List<String> getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(List<String> acceptedBy) { this.acceptedBy = acceptedBy; }
    public List<EmployeeUpdateDTO> getUpdates() { return updates; }
    public void setUpdates(List<EmployeeUpdateDTO> updates) { this.updates = updates; }

    /** Frontend format: employeeId + weeklyLogs */
    public static class EmployeeUpdateDTO {
        private String employeeId;
        private List<WeeklyLogDTO> weeklyLogs;

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public List<WeeklyLogDTO> getWeeklyLogs() { return weeklyLogs; }
        public void setWeeklyLogs(List<WeeklyLogDTO> weeklyLogs) { this.weeklyLogs = weeklyLogs; }
    }

    public static class WeeklyLogDTO {
        private String date;
        private String work;
        private Integer progress;
        private String status; // "On Track" | "At Risk" | "Delayed"

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getWork() { return work; }
        public void setWork(String work) { this.work = work; }
        public Integer getProgress() { return progress; }
        public void setProgress(Integer progress) { this.progress = progress; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
