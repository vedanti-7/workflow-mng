package com.company.pm.repository;

import com.company.pm.entity.LeaveApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, String> {
    List<LeaveApplication> findByManagerIdAndStatus(String managerId, LeaveApplication.Status status);
    List<LeaveApplication> findByEmpId(String empId);

    @Transactional
    @Modifying
    @Query("DELETE FROM LeaveApplication l WHERE l.prjId = :prjId")
    void deleteByPrjId(@Param("prjId") String prjId);

    @Query("SELECT COUNT(l) FROM LeaveApplication l WHERE l.empId = :empId AND l.leaveType = :type AND MONTH(l.fromDate) = :month AND YEAR(l.fromDate) = :year AND l.status = 'Approved'")
    long countByEmpIdAndTypeAndMonth(@Param("empId") String empId, @Param("type") String type, @Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(l) FROM LeaveApplication l WHERE l.empId = :empId AND l.leaveType != 'WFH' AND MONTH(l.fromDate) = :month AND YEAR(l.fromDate) = :year AND l.status = 'Approved'")
    long countTotalLeavesInMonth(@Param("empId") String empId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(l) FROM LeaveApplication l WHERE l.empId = :empId AND l.leaveType != 'WFH' AND YEAR(l.fromDate) = :year AND l.status = 'Approved'")
    long countTotalLeavesInYear(@Param("empId") String empId, @Param("year") int year);

    @Query("SELECT l FROM LeaveApplication l WHERE l.empId = :empId AND MONTH(l.fromDate) = :month AND YEAR(l.fromDate) = :year ORDER BY l.fromDate DESC")
    List<LeaveApplication> findByEmpIdAndMonth(@Param("empId") String empId, @Param("month") int month, @Param("year") int year);
}
