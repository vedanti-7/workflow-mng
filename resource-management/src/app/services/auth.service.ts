import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '../models/login-response';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(id: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { id: id.trim(), password: password.trim() },
      { withCredentials: true }
    );
  }

  /** Check if an ID is already taken. Returns { available: boolean, message: string } */
  checkId(id: string): Observable<{ available: boolean; message: string }> {
    return this.http.get<{ available: boolean; message: string }>(
      `${this.apiUrl}/check-id`, { params: { id } }
    );
  }

  signup(id: string, name: string, password: string, designation: string, skills: string, email: string, document: File): Observable<{ message: string }> {
    const form = new FormData();
    form.append('id', id);
    form.append('name', name);
    form.append('password', password);
    form.append('designation', designation);
    form.append('skills', skills);
    form.append('email', email);
    form.append('document', document);
    return this.http.post<{ message: string }>(`${this.apiUrl}/signup`, form);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getPendingSignups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/signup-requests`);
  }

  approveSignup(empId: string, adminId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/admin/signup-requests/${encodeURIComponent(empId)}/approve`,
      {},
      { params: { adminId } }
    );
  }

  rejectSignup(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/admin/signup-requests/${encodeURIComponent(id)}/reject`
    );
  }
}

