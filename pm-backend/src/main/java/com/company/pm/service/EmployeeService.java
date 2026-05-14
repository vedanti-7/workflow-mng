package com.company.pm.service;

import com.company.pm.entity.Employee;
import com.company.pm.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository)
    {
        this.employeeRepository=employeeRepository;
    }
    public Employee saveEmployee(Employee employee)
    {
        return employeeRepository.save(employee);
    } 
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }
    public Optional<Employee> getEmployeeById(String id) 
    {
        return employeeRepository.findById(id);
    }
    public void deleteEmployee(String id)
    {
        employeeRepository.deleteById(id);
    }
}
