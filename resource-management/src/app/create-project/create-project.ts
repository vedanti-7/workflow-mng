import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { EmployeeBackendService } from '../services/employee.service';

/** Employee from backend (id, name, skills) for create-project dropdown */
interface BackendEmployee {
  id: string;
  name: string;
  skills: string[];
}

@Component({
  selector: 'app-create-project',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-project.html',
  styleUrl: './create-project.css',
})
export class CreateProject implements OnInit {
  project = {
    name: '',
    techStack: '',
    description: '',
    assignedEmployees: [] as string[],
    manager: 'Manager',
    status: 'Not Started',
    deadline: ''
  };

  /** All employees from backend (real DB IDs so status updates and allotted projects work) */
  backendEmployees: BackendEmployee[] = [];
  filteredEmployees: BackendEmployee[] = [];

  constructor(
    private projectService: ProjectService,
    private employeeBackend: EmployeeBackendService,
    private router: Router
  ) {}

  ngOnInit() {
    this.employeeBackend.getAllEmployees().subscribe({
      next: (list) => {
        this.backendEmployees = (list || []).map((e: any) => ({
          id: e.id || e.emp_id,
          name: e.name || e.id || e.emp_id,
          skills: this.normalizeSkills(e.skills)
        }));
        this.onTechChange();
      },
      error: () => {
        this.backendEmployees = [];
        this.filteredEmployees = [];
      }
    });
  }

  onTechChange() {
    const techStack = this.project.techStack || '';
    const required = techStack
      .split(/[\n,\/|]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (required.length === 0) {
      // Fallback: keep selection possible even when no skill filter is entered.
      this.filteredEmployees = [...this.backendEmployees];
      return;
    }

    this.filteredEmployees = this.backendEmployees.filter(emp => {
      const normalizedSkills = (emp.skills || []).map(s => s.toLowerCase());
      // Comma-separated tech stack should suggest employees when either side partially matches.
      return required.some(r =>
        normalizedSkills.some(s => s.includes(r) || r.includes(s))
      );
    });
  }

  private normalizeSkills(skills: string | undefined): string[] {
    // if (!skills){
    //   return [];
    // }
    // return skills
    // .split(/[\n,\/|]+/)
    // .map(s => s.trim())
    // .filter(Boolean);
    if (!skills) {
      return [];
    }

    if (Array.isArray(skills)) {
      return skills.map((s: any) =>
        typeof s === 'string' ? s : s.skill
      );
    }

    if (typeof skills === 'string') {
      return skills
        .split(/[\n,\/|]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    return [];
    
  }

  isSelected(empId: string): boolean {
    return this.project.assignedEmployees.includes(empId);
  }

  getSkillsDisplay(emp: BackendEmployee): string {
    if (!emp.skills) return '';
    return Array.isArray(emp.skills) ? emp.skills.join(', ') : String(emp.skills);
  }

  toggleEmployee(empId: string) {
    const index = this.project.assignedEmployees.indexOf(empId);
    if (index === -1) {
      this.project.assignedEmployees.push(empId);
    } else {
      this.project.assignedEmployees.splice(index, 1);
    }
  }

  createProject() {
    if (
    !this.project.name || 
    !this.project.techStack || 
    !this.project.description ||
    this.project.assignedEmployees.length === 0
  ) {
    alert('Please fill all fields and assign employees');
    return;
    }

    const managerId = sessionStorage.getItem('userId');
    if (!managerId) {
      alert('Not logged in');
      return;
    }

    const newProject = {
      name: this.project.name,
      techStack: this.project.techStack,
      description: this.project.description,
      deadline: this.project.deadline,
      assignedEmployees: this.project.assignedEmployees
    };

    this.projectService
    .createProject(newProject, managerId)
    .subscribe({
      next: () => {
        this.projectService.projectChanged$.next();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Create project failed', err);
        alert(err.error?.message || 'Failed to create project');
      }
    });
  }
}
