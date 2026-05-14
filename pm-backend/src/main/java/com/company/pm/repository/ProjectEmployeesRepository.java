package com.company.pm.repository;

import com.company.pm.entity.ProjectEmployees;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectEmployeesRepository extends JpaRepository<ProjectEmployees, Long> {
    List<ProjectEmployees> findByEmpIdAndAcceptedFalse(String empId);
    List<ProjectEmployees> findByEmpIdAndAcceptedTrue(String empId);
    List<ProjectEmployees> findByPrjId(String prjId);
    Optional<ProjectEmployees> findByPrjIdAndEmpId(String prjId, String empId);

    @Transactional
    @Modifying
    @Query("DELETE FROM ProjectEmployees p WHERE p.prjId = :prjId")
    void deleteByPrjId(String prjId);
}