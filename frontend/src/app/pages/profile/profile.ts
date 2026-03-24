import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  user: any = null;
  loading = true;
  saving = false;

  formData = {
    fullName: '',
    email: ''
  };

  ngOnInit(): void {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('PROFILE storedUser:', storedUser);

    if (!storedUser?._id) {
      alert('User not found. Please login again.');
      this.loading = false;
      return;
    }

    this.loadProfile(storedUser._id);
  }

  loadProfile(userId: string): void {
    console.log('PROFILE fetching:', `http://localhost:5000/api/users/${userId}`);

    this.loading = true;

    this.http
      .get<any>(`http://localhost:5000/api/users/${userId}`)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          console.log('PROFILE response:', res);

          this.user = res;
          this.formData = {
            fullName: res.fullName || '',
            email: res.email || ''
          };
        },
        error: (err) => {
          console.error('PROFILE load error:', err);
          alert(err.error?.message || 'Failed to load profile');
        }
      });
  }

  saveProfile(form: NgForm): void {
    if (!form.valid || !this.user?._id) {
      form.control.markAllAsTouched();
      return;
    }

    this.saving = true;

    this.http
      .put<any>(`http://localhost:5000/api/users/${this.user._id}`, this.formData)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.user = res.user;
          localStorage.setItem('user', JSON.stringify(res.user));
          alert('Profile updated successfully');
        },
        error: (err) => {
          console.error('PROFILE save error:', err);
          alert(err.error?.message || 'Failed to update profile');
        }
      });
  }

  getInitials(): string {
    if (!this.user?.fullName) return 'U';

    return this.user.fullName
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}