package com.company.pm.controller;

import com.company.pm.entity.DailyTask;
import com.company.pm.entity.DailyTaskResponse;
import com.company.pm.repository.DailyTaskRepository;
import com.company.pm.repository.DailyTaskResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily-tasks")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class DailyTaskController {

    @Autowired
    private DailyTaskRepository taskRepo;

    @Autowired
    private DailyTaskResponseRepository responseRepo;

    // Manager: add a standup task (max 3 per project per day)
    @PostMapping
    public ResponseEntity<?> addTask(@RequestBody Map<String, String> body) {
        String prjId = body.get("prjId");
        String title = body.get("title");
        if (prjId == null || title == null || title.isBlank())
            return ResponseEntity.badRequest().body("prjId and title required");

        LocalDate today = LocalDate.now();
        long count = taskRepo.countByPrjIdAndTaskDate(prjId, today);
        if (count >= 3)
            return ResponseEntity.badRequest().body("Daily limit of 3 stand-up tasks reached");

        DailyTask task = new DailyTask();
        task.setTaskId(UUID.randomUUID().toString());
        task.setPrjId(prjId);
        task.setTitle(title);
        task.setTaskDate(today);
        taskRepo.save(task);
        return ResponseEntity.ok(task);
    }

    // Manager: get today's tasks for a project (for standup status display)
    @GetMapping("/project/{prjId}")
    public List<DailyTask> getTasksForProject(@PathVariable String prjId) {
        LocalDate today = LocalDate.now();
        return taskRepo.findByPrjId(prjId).stream()
            .filter(t -> today.equals(t.getTaskDate()))
            .toList();
    }

    // Employee: today's tasks (all) + past incomplete tasks
    @GetMapping("/project/{prjId}/pending")
    public List<DailyTask> getPendingTasks(@PathVariable String prjId) {
        LocalDate today = LocalDate.now();
        return taskRepo.findByPrjId(prjId).stream()
            .filter(t -> today.equals(t.getTaskDate()) || !Boolean.TRUE.equals(t.getCompleted()))
            .toList();
    }

    // Employee: submit response (yes/no + reason)
    @PostMapping("/{taskId}/respond")
    public ResponseEntity<?> respond(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        String empId = body.get("empId");
        boolean done = Boolean.parseBoolean(body.get("done"));
        String comment = body.getOrDefault("comment", "");

        if (empId == null) return ResponseEntity.badRequest().body("empId required");

        DailyTaskResponse resp = responseRepo.findByTaskIdAndEmpId(taskId, empId)
            .orElse(new DailyTaskResponse());
        resp.setTaskId(taskId);
        resp.setEmpId(empId);
        resp.setDone(done);
        resp.setComment(comment);
        responseRepo.save(resp);

        // If any employee marks done=true, mark the whole task as completed
        if (done) {
            taskRepo.findById(taskId).ifPresent(task -> {
                task.setCompleted(true);
                taskRepo.save(task);
            });
        }

        return ResponseEntity.ok("Response saved");
    }
}
