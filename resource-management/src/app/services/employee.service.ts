import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Employee{
    id: string;
    name: string;
    designation: string;
    role: string;
}

@Injectable({
    providedIn: 'root',
})
export class EmployeeBackendService{
    private apiUrl=`${environment.apiUrl}/employees`;

    constructor(private http:HttpClient){}

    getAllEmployees() : Observable<any[]>{
        return this.http.get<any[]>(`${this.apiUrl}/with-skills`);
    }
    getEmployeeById(id : string):Observable<Employee>{
        return this.http.get<Employee>(`${this.apiUrl}/${id}`);
    }
    addEmployee(employee: Employee): Observable<Employee>{
        return this.http.post<Employee>(this.apiUrl,employee);
    }
    deleteEmployee(id: String): Observable<void>{
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
