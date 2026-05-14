package com.company.pm.repository;

import com.company.pm.entity.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface DailyTaskRepository extends JpaRepository<DailyTask, String> {
    List<DailyTask> findByPrjId(String prjId);
    long countByPrjIdAndTaskDate(String prjId, LocalDate date);

    @Transactional
    @Modifying
    @Query("DELETE FROM DailyTask d WHERE d.prjId = :prjId")
    void deleteByPrjId(String prjId);
}
