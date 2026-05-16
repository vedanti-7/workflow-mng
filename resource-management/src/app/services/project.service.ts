import { Injectable, Inject, PLATFORM_ID} from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

// 👇 ADD THIS AT THE TOP OF project.service.ts

interface DailyTaskResponse {
  done: boolean;
  comment: string;
}

interface DailyTask {
  id: string;
  date: string;
  title: string;
  completed: boolean; 
  responses: {
    [employeeId: string]: DailyTaskResponse;
  };
}

interface WeeklyLog {
  date: string;
  work: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Delayed';
}

interface ProjectUpdate {
  employeeId: string;
  weeklyLogs: WeeklyLog[];
}

interface Project {
  name: string;
  description: string;
  techStack: string;
  managerId: string;
  assignedEmployees: string[];
  acceptedBy: string[];
  updates: ProjectUpdate[];
  dailyTasks: DailyTask[];
  startDate: string;
  deadline: string;
}
interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  projectName: string | null;
  managerId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';

  decisionAt?: string;      // NEW
  notificationExpiresAt?: string;  // NEW
}

export interface BackendProject {
  prjId: string;
  name: string;
  description: string;
  techStack: string;
  managerId: string;
  startDate: string;
  deadline: string;
  status: string;
  standupTasks?: any[];
  // 👇 make frontend fields optional
  dailyTasks?: any[];
  updates?: any[];
  acceptedBy?: string[];
  assignedEmployees?: string[];
}


@Injectable({
  providedIn: 'root'
})

export class ProjectService {

  private baseUrl = `${environment.apiUrl}/api/projects`;
  
  projectChanged$ = new Subject<void>();

  // Employees (can later come from backend)
  private employees = [
    { id: 'emp_tina', name: 'Tina', skills: ['Angular', 'Frontend', 'REST_API'] },
    { id: 'emp_raj', name: 'Raj', skills: ['Sprping Boot', 'Backend', 'MySQL'] },
    { id: 'emp_aman', name: 'Aman', skills: ['Angular', 'Backend', 'MySQL'] },
    { id: 'emp_neha', name: 'Neha', skills: ['UI/UX', 'Frontend'] }
  ];

  private projects: Project[] = [];
  private leaves: LeaveApplication[] = [];

  // private saveProjects() {
  //   localStorage.setItem('projects', JSON.stringify(this.projects));
  // }
  // private saveLeaves() {
  //   localStorage.setItem('leaves', JSON.stringify(this.leaves));
  // }

  private isExpired(project: any): boolean {
    const today = new Date();
    const deadline = new Date(project.deadline);
    return deadline.getTime() < today.getTime();
  }
  private cleanExpiredNotifications() {
    const now = new Date();

    this.leaves.forEach(leave => {
      if (
        leave.notificationExpiresAt &&
        new Date(leave.notificationExpiresAt) < now
      ) {
        leave.notificationExpiresAt = undefined;
      }
    });

    this.saveLeaves();
  }
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
       const saved = localStorage.getItem('projects');

        if (saved) {
          const parsed = JSON.parse(saved);

          this.projects = parsed.filter((project: any) =>
            project &&
            project.name &&
            project.managerId &&
            Array.isArray(project.assignedEmployees) &&
            project.assignedEmployees.length > 0 &&
            !this.isExpired(project)
          );
        }
        const savedLeaves = localStorage.getItem('leaves');
        if (savedLeaves) {
          this.leaves = JSON.parse(savedLeaves);
        }
        this.cleanExpiredNotifications();
        this.saveProjects();
      }
    }
    private saveProjects() {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('projects', JSON.stringify(this.projects));
      }
    }

    private saveLeaves() {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('leaves', JSON.stringify(this.leaves));
      }
    }
  

  // ---------------- EMPLOYEES ----------------

  getAllEmployees() {
    return of(this.employees);
  }

  getEmployeesBySkill(input: string) {
    if (!input.trim()) return [];

  const requiredSkills = input
    .split(',')
    .map(skill => skill.trim().toLowerCase());

  return this.employees.filter(emp =>
    emp.skills.some(empSkill =>
      requiredSkills.some(reqSkill =>
        empSkill.toLowerCase().includes(reqSkill)
      )
    )
  );
  }

  // ---------------- PROJECTS ----------------

  // createProject(project: any, managerId: String) {
  //   const payload = {
  //     prjId: crypto.randomUUID(),   // 🔥 ADD THIS
  //     name: project.name,
  //     description: project.description,
  //     techStack: project.techStack,
  //     managerId: managerId,
  //     startDate: new Date().toISOString().split('T')[0], // LocalDate format
  //     deadline: project.deadline,
  //     status: 'Not Started'
  //   };

  //   return this.http.post(this.baseUrl, payload);
  // }
  /** Create project and assign employees (backend stores in project_employees, sets employee status Billable). */
  createProject(project: any, managerId: string) {
    const payload = {
      name: project.name,
      description: project.description,
      techStack: project.techStack,
      managerId,
      deadline: project.deadline,
      assignedEmployees: project.assignedEmployees || []
    };
    return this.http.post<BackendProject>(`${this.baseUrl}/create`, payload);
  }

  getProjectsForManager(managerId: string) {
    return this.http.get<BackendProject[]>(`${this.baseUrl}/manager/${managerId}`);
  }

  /** Manager dashboard: projects with assignedEmployees, acceptedBy, updates (weekly logs). */
  getProjectsDetailForManager(managerId: string) {
    return this.http.get<BackendProject[]>(`${this.baseUrl}/manager/${managerId}/detail`);
  }

  // ---------------- EMPLOYEE SIDE (backend) ----------------

  /** Allotted projects (assigned, not yet accepted) from backend. */
  getProjectsAllottedForEmployee(empId: string) {
    return this.http.get<BackendProject[]>(`${this.baseUrl}/employee/${empId}/allotted`);
  }

  /** Current projects (accepted) from backend. */
  getProjectsCurrentForEmployee(empId: string) {
    return this.http.get<Project[]>(`${this.baseUrl}/employee/${empId}/current`);
  }

  /** Accept project (backend project_employees.accepted = true). */
  acceptProjectByPrjId(prjId: string, empId: string) {
    return this.http.post(`${this.baseUrl}/${prjId}/accept/${empId}`, {}, { responseType: 'text' });
  }

  // ---------------- LEAVE APPLICATIONS (backend) ----------------

  submitLeaveBackend(empId: string, managerId: string, prjId: string, fromDate: string, toDate: string, reason: string, leaveType: string = 'Casual', document?: File) {
    const form = new FormData();
    form.append('empId', empId);
    form.append('managerId', managerId);
    form.append('prjId', prjId);
    form.append('fromDate', fromDate);
    form.append('toDate', toDate);
    form.append('reason', reason);
    form.append('leaveType', leaveType);
    if (document) form.append('document', document);
    return this.http.post(`${environment.apiUrl}/api/leaves/apply`, form);
  }

  getLeaveBalance(empId: string) {
    return this.http.get<any>(`${environment.apiUrl}/api/leaves/balance/${empId}`);
  }

  getMonthlyLeaves(empId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/leaves/employee/${empId}/monthly`);
  }

  getPendingLeavesForManager(managerId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/leaves/manager/${managerId}/pending`);
  }

  getLeavesForEmployeeBackend(empId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/leaves/employee/${empId}`);
  }

  decideLeave(leaveId: string, status: 'Approved' | 'Rejected') {
    return this.http.post(`${environment.apiUrl}/api/leaves/${leaveId}/decision`, { status }, { responseType: 'text' });
  }

  // ---------------- DAILY STANDUP (backend) ----------------

  addStandupTask(prjId: string, title: string) {
    return this.http.post(`${environment.apiUrl}/api/daily-tasks`, { prjId, title }, { responseType: 'json' });
  }

  getStandupTasksForProject(prjId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/daily-tasks/project/${prjId}`);
  }

  getTodayStandupTasks(prjId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/daily-tasks/project/${prjId}/pending`);
  }

  respondToStandupTask(taskId: string, empId: string, done: boolean, comment: string) {
    return this.http.post(`${environment.apiUrl}/api/daily-tasks/${taskId}/respond`,
      { empId, done: String(done), comment }, { responseType: 'text' });
  }

  /** Get weekly logs for a specific employee on a project */
  getProjectsDetailForEmployee(prjId: string, empId: string) {
    return this.http.get<any[]>(`${this.baseUrl}/${prjId}/weekly-logs/${empId}`);
  }

  /** Submit weekly update to backend (weekly_updates table). */
  addWeeklyUpdateBackend(prjId: string, empId: string, date: string, work: string, progress?: number, status?: string) {
    return this.http.post<unknown>(`${this.baseUrl}/${prjId}/weekly-update`, {
      empId,
      date,
      workDone: work,
      work,
      progress: progress ?? 0,
      status: status ?? 'On Track'
    });
  }

  // ---------------- EMPLOYEE SIDE (frontend-only, leave/localStorage - do not remove) ----------------

  getProjectsForEmployee(employeeId: string) {
    return this.projects.filter(project =>
      project.assignedEmployees.includes(employeeId) &&
      !project.acceptedBy.includes(employeeId)
    );
  }

  acceptProject(projectName: string, employeeId: string) {
    const project = this.projects.find(p => p.name === projectName);
    if (!project) return;

    if (!project.acceptedBy.includes(employeeId)) {
      project.acceptedBy.push(employeeId);

      if (!project.updates.find((u: any) => u.employeeId === employeeId)) {
        project.updates.push({
          employeeId,
          weeklyLogs: []
        });
      }

      this.saveProjects();
    }
  }

  getCurrentProject(employeeId: string) {
    return this.projects.filter(project =>
      project.acceptedBy?.includes(employeeId) &&
      project.assignedEmployees?.includes(employeeId)
    );
  }
  // ---------------- UPDATES ----------------

    addWeeklyUpdate(
        projectName: string,
        employeeId: string,
        date: string,
        work: string,
    ) {
        const project = this.projects.find(p => p.name === projectName);
        if (!project) {
          alert('This project no longer exists. It may have been deleted by the manager.');
          return;
        }

        let empUpdate = project.updates.find(
          (u: any) => u.employeeId === employeeId
        );

        if (!empUpdate) {
          empUpdate = {
            employeeId: employeeId,
            weeklyLogs: []
          };
          project.updates.push(empUpdate);
        }

        // calculate progress based on deadline
        // previous progress (if any)
        const lastLog =
          empUpdate.weeklyLogs.at(-1);

        let progress = lastLog ? lastLog.progress : 0;

        // effort-based increment
        const WEEKLY_PROGRESS_INCREMENT = 10;

        // only increase if work is meaningful
        const effort = Math.min(work.length / 50, 1);
        progress += Math.round(effort * 15);

        // cap at 100
        progress = Math.min(progress, 100);

        // auto status
        let status: 'On Track' | 'At Risk' | 'Delayed' = 'On Track';
        if (progress < 40) {
          status = 'Delayed';
        } else if (progress < 70) {
          status = 'At Risk';
        }

        // push update
        empUpdate.weeklyLogs.push({
          date,
          work,
          progress,
          status
        });

        this.saveProjects();
    }

    deleteProject(projectId: string) {
      // this.projects = this.projects.filter(
      //   p => p.name !== projectName
      // );

      // this.saveProjects();
      // this.projectChanged$.next();
      return this.http.delete(`${this.baseUrl}/${projectId}`);
  }

    updateDailyTask(
    projectName: string,
    taskId: string,
    employeeId: string,
    done: boolean,
    comment: string
  ) {
      const project = this.projects.find(p => p.name === projectName);
      if (!project) return;

      const task = project.dailyTasks.find(t => t.id === taskId);
      if (!task) return;

      // ✅ CREATE response ONLY on submit
      task.responses[employeeId] = {
        done,
        comment
      };

      if (done) {
        task.completed = true;
      }

      this.saveProjects();
      this.projectChanged$.next();
  }  

  addDailyTask(projectName: string, title: string) {
    const project = this.projects.find(p => p.name === projectName);
    if (!project) return;

    const today = new Date().toISOString().split('T')[0];

    const task: DailyTask = {
      id: crypto.randomUUID(),
      date: today,
      title,
      completed: false,  
      responses: {}
    };

    project.dailyTasks.push(task);
    this.saveProjects();
    this.projectChanged$.next();
  }
  getLeavesForManager(managerId: string) {
    const now = new Date();

    return this.leaves.filter(l => {

      if (l.managerId !== managerId) return false;

      // Remove Approved or Rejected immediately
      if (l.status !== 'Pending') return false;

      // Remove if expired (older than 3 days)
      if (
        l.notificationExpiresAt &&
        new Date(l.notificationExpiresAt) < now
      ) {
        return false;
      }

      return true;
    });
  }
  getLeavesForEmployee(employeeId: string) {
    return this.leaves.filter(l => l.employeeId === employeeId);
  }
  updateLeaveStatus(
    leaveId: string,
    status: 'Approved' | 'Rejected'
  ) {
      const leave = this.leaves.find(l => l.id === leaveId);
      if (!leave) return;

      leave.status = status;

      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 1); // 24 hours

      leave.decisionAt = now.toISOString();
      leave.notificationExpiresAt = expiry.toISOString();

      this.saveLeaves();
      this.projectChanged$.next();
  }
  submitLeave(
    employeeId: string,
    fromDate: string,
    toDate: string,
    reason: string
  ) {
      const employee = this.employees.find(e => e.id === employeeId);
      if (!employee) return;

      const currentProject = this.getCurrentProject(employeeId);

      let managerId = '';
      let projectName: string | null = null;

      if (currentProject.length > 0) {
        managerId = currentProject[0].managerId;
        projectName = currentProject[0].name;
      } else {
        // Bench case
        managerId = 'manager_main'; // default admin manager
        projectName = null;
      }
      // ✅ CREATE 3-DAY EXPIRY FOR MANAGER
      const now = new Date();
      const managerExpiry = new Date();
      managerExpiry.setDate(now.getDate() + 3);
      
      const leave: LeaveApplication = {
        id: crypto.randomUUID(),
        employeeId,
        employeeName: employee.name,
        projectName,
        managerId,
        fromDate,
        toDate,
        reason,
        status: 'Pending',
        notificationExpiresAt: managerExpiry.toISOString()
      };

      this.leaves.push(leave);
      this.saveLeaves();
      this.projectChanged$.next(); // reuse existing stream
  }
}
