import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  pendingRequests: any[] = [];
  loading = true;
  adminId = '';
  adminName = '';

  private apiUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.adminId = sessionStorage.getItem('userId') || '';
    this.adminName = sessionStorage.getItem('name') || 'Admin';
    this.loadRequests();
  }

  async loadRequests() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const data = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/admin/signup-requests`)
      );
      console.log('Pending requests:', JSON.stringify(data));
      this.pendingRequests = data || [];
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      alert('Error: ' + (err?.error?.message || err?.status || err));
      this.pendingRequests = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async approve(empId: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(
          `${this.apiUrl}/admin/signup-requests/${encodeURIComponent(empId)}/approve`,
          {},
          { params: { adminId: this.adminId } }
        )
      );
      alert(res.message);
      this.loadRequests();
    } catch (err: any) {
      alert(err?.error?.message || 'Approval failed');
    }
  }

  async reject(empId: string) {
    try {
      const res = await firstValueFrom(
        this.http.delete<any>(
          `${this.apiUrl}/admin/signup-requests/${encodeURIComponent(empId)}/reject`
        )
      );
      alert(res.message);
      this.loadRequests();
    } catch (err: any) {
      alert(err?.error?.message || 'Rejection failed');
    }
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/']);
  }
}
