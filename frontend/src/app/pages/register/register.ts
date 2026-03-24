import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  icons = {
    ArrowLeft
  };

  user = {
    fullName: '',
    email: '',
    password: ''
  };

  register() {
    this.http.post('http://localhost:5000/api/users/register', this.user)
      .subscribe({
        next: () => {
          alert('Registered successfully! Please login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert(err.error?.message || 'Registration failed');
        }
      });
  }
}