import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  userId = '';
  saving = false;

  profile = {
    name: '',
    email: '',
    designation: '',
    empId: '',
    joinedDate: '',
    employmentType: ''
  };

  // Which field is currently being edited
  editingField: string | null = null;
  editValue = '';

  private getFallbackJoinDate(id: string): string {
    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const daysAgo = 365 + (seed % 547);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  get initials(): string {
    return (this.profile.name || this.userId)
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  get employmentColor(): string {
    const t = this.profile.employmentType;
    if (t === 'Full-Time')  return '#4f8ef7';
    if (t === 'Part-Time')  return '#a78bfa';
    if (t === 'Contractor' || t === 'Freelancer') return '#f59e0b';
    return '#64748b';
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.userId = sessionStorage.getItem('userId') || '';

    // Instant render from session
    this.profile = {
      name: sessionStorage.getItem('name') || this.userId,
      email: sessionStorage.getItem('email') || '',
      designation: sessionStorage.getItem('role') || '',
      empId: this.userId,
      joinedDate: this.getFallbackJoinDate(this.userId),
      employmentType: 'Full-Time'
    };

    // Background fetch for full data
    this.http.get<any>(`http://localhost:8080/employees/${this.userId}`).subscribe({
      next: (emp) => {
        this.profile = {
          name: emp.name || this.profile.name,
          email: emp.email || '',
          designation: emp.designation || this.profile.designation,
          empId: emp.id || this.userId,
          joinedDate: emp.joinedDate ? this.formatDate(emp.joinedDate) : this.getFallbackJoinDate(this.userId),
          employmentType: emp.employmentType || 'Full-Time'
        };
        if (emp.email) sessionStorage.setItem('email', emp.email);
      },
      error: () => {}
    });
  }

  startEdit(field: string) {
    this.editingField = field;
    this.editValue = (this.profile as any)[field] || '';
  }

  cancelEdit() {
    this.editingField = null;
    this.editValue = '';
  }

  saveField(field: string) {
    const trimmed = this.editValue.trim();
    if (!trimmed) { this.cancelEdit(); return; }

    (this.profile as any)[field] = trimmed;
    if (field === 'name') sessionStorage.setItem('name', trimmed);

    this.saving = true;
    this.http.put<any>(`http://localhost:8080/employees/${this.userId}`, {
      name: this.profile.name,
      email: this.profile.email,
      designation: this.profile.designation,
      employmentType: this.profile.employmentType
    }).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; }
    });

    this.editingField = null;
  }
}
