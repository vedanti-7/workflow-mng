import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProjectCardComponent } from '../project-card/project-card';
import { EmployeeTable } from '../employee-table/employee-table';
import { CommonModule } from '@angular/common';
import { ProjectService, BackendProject } from '../services/project.service';
import { EmployeeBackendService } from '../services/employee.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ProfileComponent } from '../profile/profile';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports:[ProjectCardComponent,EmployeeTable,CommonModule,RouterModule,ProfileComponent],
  standalone: true,
})
export class Dashboard implements OnInit, OnDestroy {
  activePage: 'home' | 'profile' = 'home';
  projects: BackendProject[] = [];
  employees: any[] = [];
  managerLeaves: any[] = [];
  managerName = '';
  projectsLoading = true;
  projectsError: string | null = null;
  private routerSub?: Subscription;
  private projectChangedSub?: Subscription;
  private standupPollInterval: any;
  private dismissTimers = new Map<string, any>();

  constructor(
    private projectService: ProjectService,
    private employeeBackend: EmployeeBackendService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const managerId = sessionStorage.getItem('userId');
    if (!managerId) return;
    this.managerName = sessionStorage.getItem('name') || managerId;

    this.loadEmployees();
    this.loadManagerLeaves(managerId);

    this.projectChangedSub = this.projectService.projectChanged$.subscribe(() => {
      this.loadProjects();
      this.loadEmployees();
      this.loadManagerLeaves(managerId);
    });

    // Reload projects and employees every time we navigate to dashboard (e.g. after creating a project)
    this.routerSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      filter(e => e.urlAfterRedirects === '/dashboard' || e.url === '/dashboard')
    ).subscribe(() => {
      this.loadProjects();
      this.loadEmployees();
    });

    // Initial load of backend projects
    this.loadProjects();

    // Poll standup tasks every 15 seconds
    this.standupPollInterval = setInterval(() => {
      this.projects.forEach(p => this.reloadStandupTasks(p));
      // Also reload projects to pick up new weekly updates
      this.loadProjects();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.projectChangedSub?.unsubscribe();
    if (this.standupPollInterval) clearInterval(this.standupPollInterval);
    this.dismissTimers.forEach(t => clearTimeout(t));
  }

  // initializeDashboard() {
  //   const managerId = sessionStorage.getItem('userId');
  //   if (!managerId) return;
  //   console.log("Initializing dashboard with:", managerId);
  //   // this.employees = this.projectService.getAllEmployees();
  //   // this.managerLeaves = this.projectService.getLeavesForManager(managerId);
  //   console.log("About to load backend projects..."); 
  //   this.loadProjects();
  // }
  //deleteProject(projectId: string) {
    // this.projectService.deleteProject(projectName);

    // const managerId = sessionStorage.getItem('userId');
    // if (!managerId) return;

    // // refresh dashboard list
    //   this.projectService
    //     .getProjectsForManager(managerId)
    //     .subscribe(data => {
    //       this.projects = data;
    //     });
    // this.projectService.deleteProject(projectName);
    // const managerId = sessionStorage.getItem('userId');
    // if (!managerId) return;

    // this.projectService
    //   .getProjectsForManager(managerId)
    //   .subscribe(data => {
    //     this.projects = data;
    //   });
  //     this.projectService.deleteProject(projectId).subscribe(() => {
  //     const managerId = sessionStorage.getItem('userId');
  //     if (!managerId) return;

  //     this.projectService
  //       .getProjectsForManager(managerId)
  //       .subscribe(data => {
  //         this.projects = data;
  //       });
  //   });
  // }
  deleteProject(projectId: string) {
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.prjId !== projectId);
        this.cdr.detectChanges();
        this.loadProjects();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        // 204 No Content comes through as an error in some Angular versions — handle it
        if (err.status === 204 || err.status === 200) {
          this.projects = this.projects.filter(p => p.prjId !== projectId);
          this.cdr.detectChanges();
          this.loadProjects();
        } else {
          alert('Delete failed: ' + (err.error?.message || err.status));
        }
      }
    });
  }

  getProjectStatus(project: any): 'On Track' | 'At Risk' | 'Delayed' {
    const today = new Date();
    const deadline = new Date(project.deadline);
    const diffDays =
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) return 'Delayed';
    if (diffDays <= 10) return 'At Risk';
    return 'On Track';
  }
  getEmployeeStatus(employeeId: string): 'Bench' | 'Billable' {
    const emp = this.employees.find((e: any) => e.id === employeeId);
    const s = (emp?.status || '').toUpperCase();
    return s === 'BILLABLE' ? 'Billable' : 'Bench';
  }
  getBenchEmployees() {
    return this.employees.filter(
      emp => this.getEmployeeStatus(emp.id) === 'Bench'
    );
  }
  goToCreateProject() {
    this.router.navigate(['/create-project']);
  }
  approveLeave(id: string) {
  const managerId = sessionStorage.getItem('userId') || '';
  this.projectService.decideLeave(id, 'Approved').subscribe({
    next: () => this.loadManagerLeaves(managerId),
    error: (err) => console.error('Approve failed:', err)  // was: () => {}
  });
}
rejectLeave(id: string) {
  const managerId = sessionStorage.getItem('userId') || '';
  this.projectService.decideLeave(id, 'Rejected').subscribe({
    next: () => this.loadManagerLeaves(managerId),
    error: (err) => console.error('Reject failed:', err)  // was: () => {}
  });
}


  loadManagerLeaves(managerId: string) {
    this.projectService.getPendingLeavesForManager(managerId).subscribe({
      next: (leaves) => { this.managerLeaves = leaves || []; this.cdr.detectChanges(); },
      error: () => this.managerLeaves = []
    });
  }

  private loadEmployees() {
    this.employeeBackend.getAllEmployees().subscribe({
      next: (list) => {
        this.employees = (list || []).map((e: any) => ({
            id: e.id,
            name: e.name || e.id,
            designation: e.designation || 'Employee',
            skills: e.skills ? (typeof e.skills === 'string' ? e.skills.split(',').map((x: string) => x.trim()) : e.skills) : [],
            status: (e.status || 'Bench')
        }));
        this.applyStatusFromProjects();
        this.cdr.markForCheck();
      },
      error: () => {
          this.projectService.getAllEmployees().subscribe((list: any[]) => {
          this.employees = (list || []).map((e: any) => ({
            ...e,
            status: e.status || 'Bench' 
          }));
          this.applyStatusFromProjects();
          this.cdr.markForCheck();
        });
      }
    });
  }

  /** Ensure anyone assigned/accepted on any project shows as Billable. */
  private applyStatusFromProjects() {
    const billableIds = new Set<string>();
    for (const p of this.projects || []) {
      const assigned = (p as any).assignedEmployees || [];
      const accepted = (p as any).acceptedBy || [];
      assigned.forEach((id: string) => billableIds.add(String(id)));
      accepted.forEach((id: string) => billableIds.add(String(id)));
      if ((p as any).managerId) billableIds.add(String((p as any).managerId));
    }
    // Don't overwrite employees with empty array if projects loaded before employees
    if (this.employees.length === 0) return;

    // this.employees = this.employees.map((e: any) => ({
    //   ...e,
    //   status: billableIds.has(String(e.id)) ? 'Billable' : (e.status || 'Bench')
    // }));
    // // Add any assigned/manager IDs that aren't in the list so they still show as Billable
    // const existingIds = new Set(this.employees.map((e: any) => String(e.id)));
    // for (const id of billableIds) {
    //   if (!existingIds.has(id)) {
    //     this.employees = [...this.employees, { id, name: id, skills: [], status: 'Billable' }];
    //     existingIds.add(id);
    //   }
    // }
    const updatedEmployees = [...this.employees];
    for (const id of billableIds) {
      const idx = updatedEmployees.findIndex(e => e.id === id);
      if (idx >= 0) updatedEmployees[idx].status = 'Billable';
      else updatedEmployees.push({ id, name: id, skills: [], status: 'Billable' });
    }
    this.employees = updatedEmployees;
    this.cdr.markForCheck();
  }

  reloadStandupTasks(project: BackendProject) {
    this.projectService.getStandupTasksForProject(project.prjId).subscribe({
      next: (tasks) => {
        const todayTasks = tasks || [];

        // Schedule auto-dismiss for newly completed tasks
        todayTasks.forEach((task: any) => {
          const hasCompleted = (task.responses || []).some((r: any) => r.done === true);
          if (hasCompleted) {
            const key = `${project.prjId}-${task.taskId}`;
            if (!this.dismissTimers.has(key)) {
              const prjId = project.prjId;
              const taskId = task.taskId;
              const timer = setTimeout(() => {
                const p = this.projects.find(x => x.prjId === prjId);
                if (p?.standupTasks) {
                  p.standupTasks = p.standupTasks.filter((t: any) => t.taskId !== taskId);
                  this.projects = [...this.projects];
                  this.cdr.detectChanges();
                }
                this.dismissTimers.delete(key);
              }, 6500);
              this.dismissTimers.set(key, timer);
            }
          }
        });

        // Don't restore tasks already pending dismissal
        project.standupTasks = todayTasks.filter((t: any) => {
          const key = `${project.prjId}-${t.taskId}`;
          return !this.dismissTimers.has(key) || !(t.responses || []).some((r: any) => r.done === true);
        });
        this.projects = [...this.projects];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private loadProjects() {
    const managerId = sessionStorage.getItem('userId');

    if (!managerId) {
      this.projectsError = 'Not logged in. Please log in as a manager.';
      this.projectsLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.projectsError = null;
    this.projectsLoading = true;
    this.cdr.markForCheck();

    // Try detail endpoint first (projects with updates); fallback to basic list if it fails (e.g. CORS, 404, 500)
    this.projectService.getProjectsDetailForManager(managerId).subscribe({
      next: (data) => {
        this.projects = Array.isArray(data) ? [...data] : [];
        this.projectsLoading = false;
        this.projectsError = null;
        this.applyStatusFromProjects();
        // Load standup tasks for each project
        this.projects.forEach(p => {
          this.projectService.getStandupTasksForProject(p.prjId).subscribe({
            next: (tasks) => {
              p.standupTasks = tasks || [];
              this.projects = [...this.projects]; // trigger change detection
              this.cdr.detectChanges();
            },
            error: () => { p.standupTasks = []; }
          });
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.projectService.getProjectsForManager(managerId).subscribe({
          next: (data) => {
            const list = Array.isArray(data) ? data : [];
            this.projects = list.map((p: any) => ({
              ...p,
              assignedEmployees: p.assignedEmployees || [],
              acceptedBy: p.acceptedBy || [],
              updates: p.updates || []
            }));
            this.projectsLoading = false;
            this.projectsError = null;
            this.applyStatusFromProjects();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.projectsLoading = false;
            this.projectsError = err?.message || err?.error?.message || 'Cannot reach backend. Is it running at http://localhost:8080?';
            this.projects = [];
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
  
  
}
