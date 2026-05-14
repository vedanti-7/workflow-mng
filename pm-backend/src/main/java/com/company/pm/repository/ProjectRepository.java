package com.company.pm.repository;

import com.company.pm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.company.pm.entity.Project;

import java.util.Optional;


@Repository
public interface ProjectRepository extends JpaRepository<Project, String>{
    List<Project> findByManagerId(String managerId);
}