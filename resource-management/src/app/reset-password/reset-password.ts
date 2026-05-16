import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.css']
})
export class ResetPassword implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';
  submitting = false;
  success = false;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Invalid reset link.';
    }
  }

  submit() {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.http.post<{ message: string }>(
      'http://localhost:8080/auth/reset-password',
      null,
      { params: { token: this.token, newPassword: this.newPassword } }
    ).subscribe({
      next: (res) => {
        this.success = true;
        this.message = res.message;
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/']), 2500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Reset failed';
        this.submitting = false;
      }
    });
  }
}
