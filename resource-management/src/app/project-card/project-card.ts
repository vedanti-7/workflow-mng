import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService, BackendProject } from '../services/project.service';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.html',
  styleUrls: ['./project-card.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ProjectCardComponent implements OnChanges {
  @Input() project?: BackendProject;
  @Output() delete = new EventEmitter<string>();
  @Output() standupAdded = new EventEmitter<void>();
  newTaskTitle = '';

  constructor(private projectService: ProjectService) {}

  ngOnChanges(changes: SimpleChanges) {}

  get standupTasks(): any[] {
    return this.project?.standupTasks || [];
  }

  hasAnyCompleted(task: any): boolean {
    return (task.responses || []).some((r: any) => r.done === true);
  }

  todayTaskCount(): number {
    return this.standupTasks.length;
  }

  canAddDailyTask(): boolean {
    return this.todayTaskCount() < 3;
  }

  addDailyTask() {
    if (!this.newTaskTitle.trim()) return;
    if (!this.canAddDailyTask()) { alert('Daily limit of 3 stand-up tasks reached'); return; }
    this.projectService.addStandupTask(this.project!.prjId, this.newTaskTitle.trim()).subscribe({
      next: () => {
        this.newTaskTitle = '';
        this.standupAdded.emit(); // tell dashboard to reload
      },
      error: (err) => alert(err?.error || 'Failed to add task')
    });
  }

  private getDeadlineDate(): Date | null {
    if (!this.project?.deadline) return null;
    const d = this.project.deadline;
    const deadline = Array.isArray(d) ? new Date(d[0], (d[1] ?? 1) - 1, d[2] ?? 1) : new Date(d as string);
    return isNaN(deadline.getTime()) ? null : deadline;
  }

  private getStartDate(): Date | null {
    if (!this.project?.startDate) return null;
    const d = this.project.startDate;
    const start = Array.isArray(d) ? new Date(d[0], (d[1] ?? 1) - 1, d[2] ?? 1) : new Date(d as string);
    return isNaN(start.getTime()) ? null : start;
  }

  private getExpectedProgress(): number {
    const start = this.getStartDate();
    const deadline = this.getDeadlineDate();
    if (!start || !deadline) return 0;
    const today = new Date();
    const totalDays = (deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (totalDays <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  }

  getProjectProgress(): number {
    const start = this.getStartDate();
    const deadline = this.getDeadlineDate();
    if (!start || !deadline) return 0;
    const today = new Date();
    const totalDays = (deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (totalDays <= 0) return 0;
    const elapsedDays = Math.max(0, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsedDays < 1) return 0;
    const allLogs = (this.project?.updates || []).flatMap((emp: any) => emp.weeklyLogs || []);
    if (!allLogs.length) return 0;
    const bucketSize = totalDays < 28 ? 1 : 7;
    const bucketsElapsed = Math.max(1, Math.floor(elapsedDays / bucketSize));
    const submittedBuckets = new Set<number>();
    allLogs.forEach((log: any) => {
      const logDate = new Date(log.date);
      const bucket = Math.floor((logDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * bucketSize));
      if (bucket >= 0) submittedBuckets.add(bucket);
    });
    const submittedRatio = Math.min(1, submittedBuckets.size / bucketsElapsed);
    const timeProgress = elapsedDays / totalDays;
    return Math.min(100, Math.round(submittedRatio * timeProgress * 100));
  }

  getProjectStatus(): 'On Track' | 'At Risk' | 'Delayed' {
    const deadline = this.getDeadlineDate();
    if (!deadline) return 'On Track';
    const today = new Date();
    const daysLeft = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 10 && daysLeft > 0) return 'At Risk';
    const progress = this.getProjectProgress();
    const expected = this.getExpectedProgress();
    if (daysLeft <= 21 && progress < expected - 15) return 'Delayed';
    if (progress < expected - 30) return 'Delayed';
    return 'On Track';
  }

  getDeadlineDisplay(): string {
    if (!this.project?.deadline) return 'Not set';
    const d = this.project.deadline;
    if (Array.isArray(d)) return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
    return String(d);
  }

  getLatestUpdateWork(): string {
    if (!this.project?.updates?.length) return 'No weekly updates yet';
    return this.project.updates
      .map((emp: any) => {
        const logs = emp.weeklyLogs || [];
        // logs come newest-first from backend
        const lastLog = logs.length ? logs[0] : null;
        const work = lastLog?.work ?? lastLog?.workDone ?? '';
        return lastLog ? `${emp.employeeId}: ${work}` : `${emp.employeeId}: No updates yet`;
      })
      .join(' | ');
  }

  showDeleteConfirm = false;

  onDelete() {
    if (!this.project) return;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    this.showDeleteConfirm = false;
    this.delete.emit(this.project!.prjId);
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }
}
