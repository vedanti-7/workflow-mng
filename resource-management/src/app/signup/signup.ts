import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {

  id = '';
  name = '';
  password = '';
  designation = '';
  skills = '';
  email = '';
  document: File | null = null;
  documentError = '';

  idCheckMessage = '';
  idAvailable: boolean | null = null;
  submitting = false;

  constructor(private authService: AuthService, private router: Router) {}

  onIdBlur() {
    const trimmed = this.id.trim();
    if (!trimmed) { this.idCheckMessage = ''; this.idAvailable = null; return; }
    this.authService.checkId(trimmed).subscribe({
      next: (res) => { this.idAvailable = res.available; this.idCheckMessage = res.message; },
      error: () => { this.idAvailable = null; this.idCheckMessage = ''; }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      this.documentError = 'Only PDF files are accepted';
      this.document = null;
      input.value = '';
    } else {
      this.documentError = '';
      this.document = file;
    }
  }

  signup() {
    if (this.idAvailable === false) { alert('Please choose a unique ID.'); return; }
    if (!this.document) { alert('Please upload a PDF verification document.'); return; }

    this.submitting = true;
    this.authService.signup(this.id, this.name, this.password, this.designation, this.skills, this.email, this.document)
      .subscribe({
        next: (res) => { alert(res.message); this.router.navigate(['/']); },
        error: err => { this.submitting = false; alert(err.error?.message || 'Signup failed'); }
      });
  }
}
