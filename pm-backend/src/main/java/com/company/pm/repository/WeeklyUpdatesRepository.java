package com.company.pm.repository;

import com.company.pm.entity.WeeklyUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface WeeklyUpdatesRepository extends JpaRepository<WeeklyUpdate, Long> {
    List<WeeklyUpdate> findByPrjIdOrderByUpdateDateDesc(String prjId);

    @Transactional
    @Modifying
    @Query("DELETE FROM WeeklyUpdate w WHERE w.prjId = :prjId")
    void deleteByPrjId(String prjId);
}
