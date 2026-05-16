import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../services/project.service';
import { ProfileComponent } from '../profile/profile';

@Component({
  selector: 'app-employee-projects',
  imports: [CommonModule, FormsModule, ProfileComponent],
  templateUrl: './employee-projects.html',
  styleUrl: './employee-projects.css',
  standalone: true,
})
export class EmployeeProjects implements OnInit, OnDestroy {
  employeeId!: string;
  employeeName: string = '';
  employeeRole: string = '';
  sidebarPage: 'home' | 'profile' = 'home';
  todayDate: string = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  allottedProjects: any[] = [];
  currentProjects: any[] = [];
  activeTab: string = 'projects';
  private pollInterval: any;
  
  leave = {
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'Casual'
  };
  leaveDocument: File | null = null;
  leaveDocError = '';

  onLeaveDocChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      this.leaveDocError = 'Only PDF files are accepted';
      this.leaveDocument = null;
      input.value = '';
    } else {
      this.leaveDocError = '';
      this.leaveDocument = file;
    }
  }

  leaveBalance: any = {
    sick: { used: 0, max: 2 },
    casual: { used: 0, max: 2 },
    emergency: { used: 0, max: 1 },
    wfh: { used: 0, max: 8 },
    monthlyTotal: { used: 0, max: 5 },
    yearlyTotal: { used: 0, max: 60 }
  };
  monthlyLeaves: any[] = [];

  standup = {
    yesterday: '',
    today: '',
    blockers: ''
  };

  myLeaves: any[] = [];

  draftResponses: {
    [taskId: string]: {
      done: boolean;
      comment: string;
    };
  } = {};

  constructor(
    private projectService: ProjectService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.employeeId = sessionStorage.getItem('userId') || '';
      this.employeeName = sessionStorage.getItem('name') || this.employeeId;
      this.employeeRole = sessionStorage.getItem('role') || 'Employee';
      console.log('Employee ID from session:', this.employeeId);
      this.refresh();
      this.loadMyLeaves();
      this.loadLeaveBalance();
      this.projectService.projectChanged$.subscribe(() => this.refresh());
      // Poll every 20 seconds for new standup tasks from manager
      this.pollInterval = setInterval(() => {
        this.refresh();
        this.loadMyLeaves();
      }, 20000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  refresh() {
    if (!this.employeeId) {
      console.warn('No employeeId in session, skipping refresh');
      return;
    }
    this.projectService.getProjectsAllottedForEmployee(this.employeeId).subscribe({
      next: (list) => {
        console.log('Allotted projects:', list);
        this.allottedProjects = list || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching allotted projects:', err);
        this.allottedProjects = [];
      }
    });
    this.projectService.getProjectsCurrentForEmployee(this.employeeId).subscribe({
      next: (list) => {
        this.currentProjects = (list || []).map((p: any) => ({ ...p, dailyTasks: [] }));
        this.currentProjects.forEach((proj: any) => {
          if (!this.weeklyUpdates[proj.name]) {
            this.weeklyUpdates[proj.name] = { date: '', workDone: '' };
          }
          this.projectService.getTodayStandupTasks(proj.prjId).subscribe({
            next: (tasks) => {
              proj.dailyTasks = tasks || [];
              proj.dailyTasks.forEach((task: any) => {
                if (!this.draftResponses[task.taskId]) {
                  this.draftResponses[task.taskId] = { done: false, comment: '' };
                }
              });
              // Replace array reference to trigger change detection
              this.currentProjects = [...this.currentProjects];
              this.cdr.detectChanges();
            },
            error: () => { proj.dailyTasks = []; }
          });
        });
        Object.keys(this.weeklyUpdates).forEach(name => {
          if (!this.currentProjects.some((p: any) => p.name === name))
            delete this.weeklyUpdates[name];
        });
        this.cdr.detectChanges();
        this.loadWeeklyHistory();
      },
      error: (err) => {
        console.error('Error fetching current projects:', err);
        this.currentProjects = [];
      }
    });
    this.myLeaves = this.projectService.getLeavesForEmployee(this.employeeId);  }
  

  acceptProject(project: any) {
    const prjId = project.prjId || project.prj_id;
    console.log('Accepting project:', prjId, 'for employee:', this.employeeId);
    if (prjId) {
      this.projectService.acceptProjectByPrjId(prjId, this.employeeId).subscribe({
        next: (res) => {
          console.log('Accept success:', res);
          this.refresh();
        },
        error: (err) => {
          console.error('Accept error:', err);
          alert(err?.error?.message || err?.message || 'Failed to accept project');
        }
      });
    } else {
      this.projectService.acceptProject(project.name, this.employeeId);
      this.refresh();
    }
  }

  // Instead of a single object, use a map
  weeklyUpdates: { 
    [projectName: string]: { date: string; workDone: string } 
  } = {};

  submitWeeklyUpdate(project: any) {
    const projectName = typeof project === 'string' ? project : project?.name;
    const prjId = typeof project === 'object' && project ? (project.prjId || project.prj_id) : null;

    if (!this.weeklyUpdates[projectName]) {
      this.weeklyUpdates[projectName] = { date: '', workDone: '' };
    }
    const { date, workDone } = this.weeklyUpdates[projectName];
    if (!date || !workDone?.trim()) {
      alert('Please enter date and work done');
      return;
    }

    if (prjId) {
      // Backend: same progress/status logic as frontend
      const effort = Math.min(workDone.length / 50, 1);
      const progress = Math.min(Math.round(effort * 15), 100);
      const status = progress < 40 ? 'Delayed' : progress < 70 ? 'At Risk' : 'On Track';
      this.projectService.addWeeklyUpdateBackend(prjId, this.employeeId, date, workDone, progress, status).subscribe({
        next: () => {
          this.weeklyUpdates[projectName] = { date: '', workDone: '' };
          alert('Weekly update submitted successfully!');
          this.refresh();
        },
        error: (err) => alert(err?.error?.message || 'Failed to submit update')
      });
    } else {
      this.projectService.addWeeklyUpdate(projectName, this.employeeId, date, workDone);
      this.weeklyUpdates[projectName] = { date: '', workDone: '' };
    }
  }
  
  updateDailyTask(project: any, task: any) {
    const draft = this.draftResponses[task.taskId];
    if (!draft) { alert('No response found'); return; }
    if (!draft.done && !draft.comment.trim()) {
      alert('Please provide a reason if the task is not finished.');
      return;
    }
    this.projectService.respondToStandupTask(task.taskId, this.employeeId, draft.done, draft.comment)
      .subscribe({
        next: () => {
          if (draft.done) {
            // Remove completed task immediately from view
            project.dailyTasks = project.dailyTasks.filter((t: any) => t.taskId !== task.taskId);
            this.currentProjects = [...this.currentProjects];
            alert('Task marked as completed!');
          } else {
            // Clear the form only, task stays
            this.draftResponses[task.taskId] = { done: false, comment: '' };
            alert('Reason submitted successfully!');
          }
          this.cdr.detectChanges();
        },
        error: (err) => alert(err?.error || 'Failed to submit response')
      });
  }

  isThisWeek(dateStr: string): boolean {
    const taskDate = new Date(dateStr);
    const today = new Date();

    const diff =
      (today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24);

    return diff >= 0 && diff < 7;
  }
  weeklyHistory: any[] = [];

  hasWeeklyHistory(): boolean {
    return this.weeklyHistory.length > 0;
  }

  // Fetch weekly history for this employee across all current projects
  loadWeeklyHistory() {
    this.weeklyHistory = [];
    this.currentProjects.forEach((proj: any) => {
      this.projectService.getProjectsDetailForEmployee(proj.prjId, this.employeeId).subscribe({
        next: (logs: any[]) => {
          this.weeklyHistory.push(...(logs || []).map((log: any) => ({
            ...log, projectName: proj.name
          })));
          this.weeklyHistory.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          this.weeklyHistory = this.weeklyHistory.slice(0, 5);
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    });
  }

  hasStandupHistory(): boolean {
    return this.currentProjects.some((p: any) =>
      (p.dailyTasks || []).some((t: any) => t.responses && t.responses.length > 0)
    );
  }

  submitStandup() {
    if (!this.standup.yesterday.trim() && !this.standup.today.trim()) {
      alert('Please fill in your standup details');
      return;
    }
    alert('Stand-up submitted!');
    this.standup = { yesterday: '', today: '', blockers: '' };
  }

  loadLeaveBalance() {
    this.projectService.getLeaveBalance(this.employeeId).subscribe({
      next: (bal) => { this.leaveBalance = bal; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.projectService.getMonthlyLeaves(this.employeeId).subscribe({
      next: (leaves) => { this.monthlyLeaves = leaves || []; this.cdr.detectChanges(); },
      error: () => this.monthlyLeaves = []
    });
  }

  submitLeave() {
    if (!this.leave.fromDate || !this.leave.toDate || !this.leave.reason.trim()) {
      alert('Fill all leave details');
      return;
    }
    if (!this.leaveDocument) {
      alert('Please upload a PDF verification document');
      return;
    }

    const currentProj = this.currentProjects[0];
    const managerId = currentProj?.managerId || '';
    const prjId = currentProj?.prjId || '';

    this.projectService.submitLeaveBackend(
      this.employeeId, managerId, prjId,
      this.leave.fromDate, this.leave.toDate, this.leave.reason, this.leave.leaveType,
      this.leaveDocument
    ).subscribe({
      next: () => {
        alert('Leave application submitted successfully!');
        this.leave = { fromDate: '', toDate: '', reason: '', leaveType: 'Casual' };
        this.leaveDocument = null;
        this.loadMyLeaves();
        this.loadLeaveBalance();
      },
      error: (err) => {
        const msg = err?.error || err?.error?.message || 'Failed to submit leave';
        alert(msg);
      }
    });
  }

  loadMyLeaves() {
    this.projectService.getLeavesForEmployeeBackend(this.employeeId).subscribe({
      next: (leaves) => {
        this.myLeaves = leaves || [];
        this.cdr.markForCheck();
      },
      error: () => this.myLeaves = []
    });
    this.loadLeaveBalance();
  }
  getActiveNotifications() {
    const now = new Date();
    const readIds: string[] = JSON.parse(localStorage.getItem('readLeaveNotifs') || '[]');
    return this.myLeaves.filter(l => {
      if (l.status === 'Pending') return false;
      if (!l.notificationExpiresAt) return false;
      if (readIds.includes(l.id)) return false;
      return new Date(l.notificationExpiresAt) > now;
    });
  }

  getPendingLeaves(): any[] {
    return this.myLeaves.filter(l => l.status === 'Pending');
  }

  getDecidedLeaves(): any[] {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return this.monthlyLeaves.filter(l => l.status === 'Approved' || l.status === 'Rejected');
  }

  markNotificationRead(leaveId: string) {
    const readIds: string[] = JSON.parse(localStorage.getItem('readLeaveNotifs') || '[]');
    if (!readIds.includes(leaveId)) {
      readIds.push(leaveId);
      localStorage.setItem('readLeaveNotifs', JSON.stringify(readIds));
    }
    this.cdr.detectChanges();
  }
}
