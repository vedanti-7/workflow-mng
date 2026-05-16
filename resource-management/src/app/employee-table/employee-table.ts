import { CommonModule } from '@angular/common';
import { Component,Input } from '@angular/core';


@Component({
  selector: 'app-employee-table',
  templateUrl: './employee-table.html',
  styleUrls: ['./employee-table.css'],
  standalone: true,
  imports:[CommonModule]
})
export class EmployeeTable {
  @Input() employees: any[] = [];
}
