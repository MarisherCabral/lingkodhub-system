import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  user: any = null;
  pending = 0;
  approved = 0;
  upcoming = 0;
  recentRequests: any[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    const rawUser = localStorage.getItem('user');
    console.log('RAW USER FROM LOCALSTORAGE:', rawUser);

    if (!rawUser) {
      this.errorMessage = 'User session not found. Please login again.';
      return;
    }

    try {
      this.user = JSON.parse(rawUser);
    } catch (e) {
      console.error('Invalid localStorage user:', e);
      this.errorMessage = 'Invalid user session. Please login again.';
      return;
    }

    console.log('PARSED USER:', this.user);

    if (!this.user?._id) {
      this.errorMessage = 'User ID not found. Please login again.';
      return;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    const url = `http://localhost:5000/api/requests/${this.user._id}`;
    console.log('DASHBOARD API URL:', url);

    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('DASHBOARD API RESPONSE:', res);

        const requests = Array.isArray(res)
          ? res
          : Array.isArray(res?.requests)
          ? res.requests
          : Array.isArray(res?.data)
          ? res.data
          : [];

        console.log('NORMALIZED REQUESTS:', requests);

        this.pending = requests.filter((r: any) =>
          (r?.status || '').toLowerCase() === 'pending'
        ).length;

        this.approved = requests.filter((r: any) =>
          (r?.status || '').toLowerCase() === 'approved'
        ).length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.upcoming = requests.filter((r: any) => {
          const rawDate =
            r?.date ||
            r?.appointmentDate ||
            r?.scheduleDate ||
            r?.requestedDate ||
            r?.createdAt;

          if (!rawDate) return false;

          const requestDate = new Date(rawDate);
          if (isNaN(requestDate.getTime())) return false;

          requestDate.setHours(0, 0, 0, 0);
          return requestDate >= today;
        }).length;

        this.recentRequests = [...requests]
          .sort((a: any, b: any) => {
            const dateA = new Date(
              a?.createdAt || a?.date || a?.appointmentDate || 0
            ).getTime();

            const dateB = new Date(
              b?.createdAt || b?.date || b?.appointmentDate || 0
            ).getTime();

            return dateB - dateA;
          })
          .slice(0, 5);

        this.loading = false;
        this.cdr.detectChanges();

        console.log('PENDING:', this.pending);
        console.log('APPROVED:', this.approved);
        console.log('UPCOMING:', this.upcoming);
        console.log('RECENT REQUESTS:', this.recentRequests);
      },
      error: (err) => {
        console.error('DASHBOARD LOAD ERROR:', err);
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          'Failed to load dashboard data';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase();
  }

  getDisplayName(): string {
    return this.user?.fullName || this.user?.name || 'User';
  }

  getUserInitial(): string {
    return this.getDisplayName().charAt(0).toUpperCase();
  }

  getRequestTitle(req: any): string {
    return (
      req?.type ||
      req?.documentType ||
      req?.requestType ||
      req?.service ||
      'Document Request'
    );
  }

  getRequestDate(req: any): string | Date {
    return (
      req?.date ||
      req?.appointmentDate ||
      req?.scheduleDate ||
      req?.requestedDate ||
      req?.createdAt ||
      new Date()
    );
  }
}