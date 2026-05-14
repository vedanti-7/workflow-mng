package com.company.pm.controller;

import com.company.pm.entity.Employee;
import com.company.pm.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/employees")
@CrossOrigin(origins = {"http://localhost:4200","http://127.0.0.1:4200"})
public class EmployeeController {
    private final EmployeeService employeeService;

    @Autowired
    private JdbcTemplate jdbc;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    /** Returns employees with their skills list — used by create-project skill matching */
    @GetMapping("/with-skills")
    public List<Map<String, Object>> getAllEmployeesWithSkills() {
        List<Employee> employees = employeeService.getAllEmployees();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Employee emp : employees) {
            List<String> skills = jdbc.queryForList(
                "SELECT skill FROM employee_skills WHERE emp_id = ?",
                String.class, emp.getId()
            );
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", emp.getId());
            row.put("name", emp.getName());
            row.put("designation", emp.getDesignation());
            row.put("status", emp.getStatus());
            row.put("email", emp.getEmail());
            row.put("joinedDate", emp.getJoinedDate());
            row.put("employmentType", emp.getEmploymentType());
            row.put("skills", skills);
            result.add(row);
        }
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable String id) {
        Optional<Employee> emp = employeeService.getEmployeeById(id);
        return emp.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Employee addEmployee(@RequestBody Employee employee) {
        return employeeService.saveEmployee(employee);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable String id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<Employee> found = employeeService.getEmployeeById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        Employee emp = found.get();
        if (body.containsKey("name"))           emp.setName(body.get("name"));
        if (body.containsKey("email"))          emp.setEmail(body.get("email"));
        if (body.containsKey("designation"))    emp.setDesignation(body.get("designation"));
        if (body.containsKey("employmentType")) emp.setEmploymentType(body.get("employmentType"));
        if (body.containsKey("joinedDate") && body.get("joinedDate") != null && !body.get("joinedDate").isBlank())
            emp.setJoinedDate(java.time.LocalDate.parse(body.get("joinedDate")));

        return ResponseEntity.ok(employeeService.saveEmployee(emp));
    }
}
