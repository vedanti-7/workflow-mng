package com.company.pm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "daily_task_responses")
public class DailyTaskResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "task_id")
    private String taskId;

    @Column(name = "emp_id")
    private String empId;

    private Boolean done;

    private String comment;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getEmpId() { return empId; }
    public void setEmpId(String empId) { this.empId = empId; }
    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
