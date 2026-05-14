package com.company.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "daily_tasks")
public class DailyTask {
    @Id
    @Column(name = "task_id")
    private String taskId;

    @Column(name = "prj_id")
    private String prjId;

    @Column(name = "task_date")
    private LocalDate taskDate;

    private String title;

    @Column(nullable = false)
    private Boolean completed = false;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "task_id", referencedColumnName = "task_id")
    private List<DailyTaskResponse> responses;

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getPrjId() { return prjId; }
    public void setPrjId(String prjId) { this.prjId = prjId; }
    public LocalDate getTaskDate() { return taskDate; }
    public void setTaskDate(LocalDate taskDate) { this.taskDate = taskDate; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public List<DailyTaskResponse> getResponses() { return responses; }
    public void setResponses(List<DailyTaskResponse> responses) { this.responses = responses; }
}
