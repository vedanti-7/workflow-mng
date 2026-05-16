import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login.css', './forgot-password.css']
})
export class ForgotPassword {
  email = '';
  isError = false;
  submitting = false;
  showDialog = false;
  dialogMessage = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  submit() {
    if (!this.email.trim()) return;
    this.submitting = true;
    this.http.post<{ message: string }>(
      'http://localhost:8080/auth/forgot-password',
      null,
      { params: { email: this.email.trim() } }
    ).subscribe({
      next: (res) => {
        this.isError = res.message.startsWith('No account');
        this.dialogMessage = res.message;
        this.submitting = false;
        this.showDialog = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isError = true;
        this.dialogMessage = err.error?.message || 'Something went wrong';
        this.submitting = false;
        this.showDialog = true;
        this.cdr.detectChanges();
      }
    });
  }

  closeDialog() {
    this.showDialog = false;
    if (!this.isError) this.email = '';
    this.cdr.detectChanges();
  }
}
