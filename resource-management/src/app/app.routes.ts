import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { EmployeeTable } from './employee-table/employee-table';
import { ProjectCardComponent } from './project-card/project-card';
import { EmployeeProjects } from './employee-projects/employee-projects';
import { CreateProject } from './create-project/create-project';
import { SignupComponent } from './signup/signup';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'dashboard', component: Dashboard },
  { path: 'admin-dashboard', component: AdminDashboard },
  { path: 'employee-table', component: EmployeeTable },
  { path: 'project-card', component: ProjectCardComponent },
  { path: 'employee-projects', component: EmployeeProjects },
  { path: 'create-project', component: CreateProject }
];
