package com.company.pm.repository;

import com.company.pm.entity.DailyTaskResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface DailyTaskResponseRepository extends JpaRepository<DailyTaskResponse, Integer> {
    List<DailyTaskResponse> findByTaskId(String taskId);
    Optional<DailyTaskResponse> findByTaskIdAndEmpId(String taskId, String empId);

    @Transactional
    @Modifying
    @Query("DELETE FROM DailyTaskResponse r WHERE r.taskId IN (SELECT d.taskId FROM DailyTask d WHERE d.prjId = :prjId)")
    void deleteByPrjId(String prjId);
}
