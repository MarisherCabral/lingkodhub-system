import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ✅ icon for back button
  icons = {
    ArrowLeft
  };

  user = {
    email: '',
    password: ''
  };

  login() {
    if (!this.user.email || !this.user.password) {
      alert('Please fill in all fields');
      return;
    }

    this.http.post<any>('http://localhost:5000/api/users/login', this.user)
      .subscribe({
        next: (res) => {

          // ✅ store user
          localStorage.setItem('user', JSON.stringify(res.user));

          // ✅ safe role check
          const role = res.user?.role || 'user';

          // 🔥 ROLE-BASED REDIRECT
          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },

        error: (err) => {
          console.error('Login error:', err);
          alert(err.error?.message || 'Login failed');
        }
      });
  }
}