package com.company.pm.repository;

import com.company.pm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String>{
    Optional<Employee> findById(String id);
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByResetToken(String resetToken);
}
