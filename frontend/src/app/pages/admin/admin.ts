import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import {
  LucideAngularModule,
  Search,
  Filter,
  FileText
} from 'lucide-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  admin: any = null;
  loading = true;
  updating = false;

  searchText = '';
  filterStatus = 'all';

  summary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  requests: any[] = [];

  icons = {
    Search,
    Filter,
    FileText
  };

  ngOnInit(): void {
    this.admin = JSON.parse(localStorage.getItem('user') || '{}');

    if (!this.admin?._id || this.admin?.role !== 'admin') {
      alert('Unauthorized access');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadAdminData();
  }

  get filteredRequests(): any[] {
    const search = this.searchText.trim().toLowerCase();

    return this.requests.filter((req) => {
      const matchesStatus =
        this.filterStatus === 'all' || req.status === this.filterStatus;

      const matchesSearch =
        !search ||
        req.userId?.fullName?.toLowerCase().includes(search) ||
        req.userId?.email?.toLowerCase().includes(search) ||
        req.type?.toLowerCase().includes(search) ||
        req.purpose?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  loadAdminData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get<any>('http://localhost:5000/api/admin/dashboard')
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.summary = res?.summary || {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          };

          this.requests = Array.isArray(res?.requests) ? res.requests : [];
          this.recalculateSummary();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('ADMIN DASHBOARD ERROR:', err);
          alert(err.error?.message || 'Failed to load admin data');
        }
      });
  }

  updateStatus(requestId: string, status: 'approved' | 'rejected'): void {
    this.updating = true;
    this.cdr.detectChanges();

    this.http.put<any>(`http://localhost:5000/api/admin/requests/${requestId}/status`, { status })
      .pipe(
        finalize(() => {
          this.updating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const index = this.requests.findIndex(r => r._id === requestId);

          if (index !== -1) {
            this.requests[index] = res.request;
            this.requests = [...this.requests];
          }

          this.recalculateSummary();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('UPDATE STATUS ERROR:', err);
          alert(err.error?.message || 'Failed to update request status');
        }
      });
  }

  recalculateSummary(): void {
    this.summary.total = this.requests.length;
    this.summary.pending = this.requests.filter(r => r.status === 'pending').length;
    this.summary.approved = this.requests.filter(r => r.status === 'approved').length;
    this.summary.rejected = this.requests.filter(r => r.status === 'rejected').length;
  }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase();
  }

  getInitials(name: string): string {
    if (!name) return 'AD';

    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
