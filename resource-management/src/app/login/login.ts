import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  imports:[FormsModule,RouterModule],
  styleUrls: ['./login.css'],
})
export class Login {
  userId = '';  // input from form
  password = ''; // optional

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login() {
    const trimmedId = this.userId.trim();
    const trimmedPassword = this.password.trim();

    console.log('Sending login:', trimmedId, trimmedPassword);

    this.authService.login(trimmedId, trimmedPassword)
      .subscribe({
        next: (response) => {
          console.log('Login response:', response);

          sessionStorage.setItem('userId', response.id);
          sessionStorage.setItem('name', response.name);
          sessionStorage.setItem('role', response.role);

          if (response.id.startsWith('AD')) {
            this.router.navigate(['/admin-dashboard']);
          } else if (response.id.startsWith('mng_')) {
            this.router.navigate(['/dashboard']);
          } else if (response.id.startsWith('emp_')) {
            this.router.navigate(['/employee-projects']);
          } else {
            alert('Unknown user type');
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Invalid credentials');
        }
      });
    }
}
