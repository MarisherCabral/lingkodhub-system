import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-requests.html',
  styleUrls: ['./my-requests.css']
})
export class MyRequests implements OnInit, OnDestroy {
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  requests: any[] = [];
  showModal = false;

  loading = false;
  showLoader = false;
  submitting = false;
  private loaderTimeout: any;

  user: any = null;

  newRequest = {
    type: '',
    purpose: '',
    notes: '',
    date: ''
  };

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('CURRENT USER:', this.user);

    if (!this.user?._id) {
      alert('User not found. Please login again.');
      return;
    }

    this.loadRequests();
  }

  ngOnDestroy(): void {
    if (this.loaderTimeout) {
      clearTimeout(this.loaderTimeout);
    }
  }

  trackByRequest(index: number, item: any): string {
    return item._id || index.toString();
  }

  loadRequests(): void {
    if (!this.user?._id) return;

    this.loading = true;
    this.showLoader = false;

    if (this.loaderTimeout) {
      clearTimeout(this.loaderTimeout);
    }

    this.loaderTimeout = setTimeout(() => {
      if (this.loading) {
        this.showLoader = true;
        this.cdr.detectChanges();
      }
    }, 300);

    const url = `http://localhost:5000/api/requests/${this.user._id}`;
    console.log('FETCHING:', url);

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        console.log('FRONTEND RESPONSE:', res);
        console.log('IS ARRAY:', Array.isArray(res));
        console.log('LENGTH:', res?.length);

        this.requests = res || [];
        this.loading = false;
        this.showLoader = false;

        if (this.loaderTimeout) {
          clearTimeout(this.loaderTimeout);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('LOAD REQUESTS ERROR:', err);
        this.requests = [];
        this.loading = false;
        this.showLoader = false;

        if (this.loaderTimeout) {
          clearTimeout(this.loaderTimeout);
        }

        this.cdr.detectChanges();
        alert(err.error?.message || 'Failed to load requests');
      }
    });
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(form?: NgForm): void {
    this.showModal = false;

    this.newRequest = {
      type: '',
      purpose: '',
      notes: '',
      date: ''
    };

    form?.resetForm({
      type: '',
      purpose: '',
      notes: '',
      date: ''
    });
  }

  submitRequest(form: NgForm): void {
    const type = this.newRequest.type?.trim();
    const purpose = this.newRequest.purpose?.trim();
    const notes = this.newRequest.notes?.trim() || '';
    const date = this.newRequest.date;

    if (!form.valid || !type || !purpose || !date) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.user?._id) {
      alert('User not found. Please login again.');
      return;
    }

    const payload = {
      userId: this.user._id,
      type,
      purpose,
      notes,
      date
    };

    this.submitting = true;

    this.http.post<any>('http://localhost:5000/api/requests', payload).subscribe({
      next: (res) => {
        console.log('SAVE RESPONSE:', res);

        this.submitting = false;
        this.closeModal(form);

        if (res?.request) {
          this.requests = [res.request, ...this.requests];
          this.cdr.detectChanges();
        } else {
          this.loadRequests();
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('SUBMIT REQUEST ERROR:', err);
        alert(err.error?.message || 'Failed to submit request');
      }
    });
  }
}