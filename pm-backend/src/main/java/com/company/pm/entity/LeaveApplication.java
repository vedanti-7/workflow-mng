package com.company.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_applications")
public class LeaveApplication {

    @Id
    private String id;

    @Column(name = "emp_id")
    private String empId;

    @Column(name = "manager_id")
    private String managerId;

    @Column(name = "prj_id")
    private String prjId;

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    private String reason;

    @Enumerated(EnumType.STRING)
    private Status status = Status.Pending;

    @Column(name = "leave_type")
    private String leaveType = "Casual";

    @Column(name = "decision_at")
    private LocalDateTime decisionAt;

    @Column(name = "notification_expires_at")
    private LocalDateTime notificationExpiresAt;

    @Column(name = "document_path")
    private String documentPath;

    public String getDocumentPath() { return documentPath; }
    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }

    public enum Status { Pending, Approved, Rejected }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmpId() { return empId; }
    public void setEmpId(String empId) { this.empId = empId; }
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    public String getPrjId() { return prjId; }
    public void setPrjId(String prjId) { this.prjId = prjId; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public LocalDateTime getDecisionAt() { return decisionAt; }
    public void setDecisionAt(LocalDateTime decisionAt) { this.decisionAt = decisionAt; }
    public LocalDateTime getNotificationExpiresAt() { return notificationExpiresAt; }
    public void setNotificationExpiresAt(LocalDateTime v) { this.notificationExpiresAt = v; }
}
