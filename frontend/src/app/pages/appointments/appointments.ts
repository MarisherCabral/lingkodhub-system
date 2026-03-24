import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css']
})
export class Appointments implements OnInit {
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  private baseUrl = 'http://localhost:5000/api/appointments';

  user: any = null;
  appointments: any[] = [];

  showModal = false;
  loading = false;
  submitting = false;
  checkingAvailability = false;
  loadingDates = false;

  message = '';
  error = '';

  availableDates: any[] = [];
  availableSlots: string[] = [];
  bookedSlots: string[] = [];

  services: string[] = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Business Permit'
  ];

  newAppointment = {
    service: '',
    date: '',
    time: '',
    notes: ''
  };

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!this.user?._id) {
      this.error = 'User not found. Please login again.';
      this.message = '';
      return;
    }

    this.loadAppointments();
  }

  trackByAppointment(index: number, item: any): string {
    return item._id || index.toString();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = '';

    this.http
      .get<any[]>(`${this.baseUrl}/user/${this.user._id}`)
      .subscribe({
        next: (res) => {
          this.appointments = Array.isArray(res) ? res : [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Load appointments error:', err);
          this.appointments = [];
          this.loading = false;
          this.error = err.error?.message || 'Failed to load appointments';
          this.message = '';
        }
      });
  }

  openModal(): void {
    this.showModal = true;
    this.resetFormState();
    this.error = '';
    this.message = '';
  }

  closeModal(form?: NgForm): void {
    this.showModal = false;
    this.resetFormState();

    form?.resetForm({
      service: '',
      date: '',
      time: '',
      notes: ''
    });
  }

  resetFormState(): void {
    this.availableDates = [];
    this.availableSlots = [];
    this.bookedSlots = [];
    this.loadingDates = false;
    this.checkingAvailability = false;

    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();

    this.newAppointment = {
      service: '',
      date: '',
      time: '',
      notes: ''
    };
  }

  onServiceChange(): void {
    this.newAppointment.date = '';
    this.newAppointment.time = '';
    this.availableSlots = [];
    this.bookedSlots = [];
    this.error = '';

    if (!this.newAppointment.service) {
      this.availableDates = [];
      return;
    }

    this.loadAvailableDates();
  }

  onDateSelected(date: string): void {
    this.newAppointment.date = date;
    this.newAppointment.time = '';
    this.availableSlots = [];
    this.bookedSlots = [];
    this.error = '';
    this.checkAvailability();
  }

  loadAvailableDates(): void {
    this.loadingDates = true;
    this.availableDates = [];
    this.error = '';

    const service = encodeURIComponent(this.newAppointment.service);

    this.http
      .get<any[]>(`${this.baseUrl}/available?service=${service}`)
      .subscribe({
        next: (res) => {
          this.availableDates = Array.isArray(res) ? res : [];
          this.loadingDates = false;
        },
        error: (err) => {
          console.error('Load available dates error:', err);
          this.availableDates = [];
          this.loadingDates = false;
          this.error = err.error?.message || 'Failed to load available dates';
        }
      });
  }

  checkAvailability(): void {
    if (!this.newAppointment.service || !this.newAppointment.date) return;

    this.checkingAvailability = true;
    this.error = '';

    const service = encodeURIComponent(this.newAppointment.service);
    const date = this.newAppointment.date;

    this.http
      .get<any>(`${this.baseUrl}/availability/${service}/${date}`)
      .subscribe({
        next: (res) => {
          this.availableSlots = Array.isArray(res?.availableSlots) ? res.availableSlots : [];
          this.bookedSlots = Array.isArray(res?.bookedTimes) ? res.bookedTimes : [];
          this.checkingAvailability = false;
        },
        error: (err) => {
          console.error('Availability error:', err);
          this.availableSlots = [];
          this.bookedSlots = [];
          this.checkingAvailability = false;
          this.error = err.error?.message || 'Failed to load available slots';
        }
      });
  }

  selectTime(slot: string): void {
    this.newAppointment.time = slot;
  }

  submitAppointment(form: NgForm): void {
    const service = this.newAppointment.service?.trim();
    const date = this.newAppointment.date;
    const time = this.newAppointment.time;
    const notes = this.newAppointment.notes?.trim() || '';

    if (!form.valid || !service || !date || !time) {
      form.control.markAllAsTouched();
      this.error = 'Please complete all required fields.';
      this.message = '';
      return;
    }

    const payload = {
      userId: this.user._id,
      service,
      date,
      time,
      notes
    };

    this.submitting = true;
    this.error = '';
    this.message = '';

    this.http.post<any>(this.baseUrl, payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.message = res?.message || 'Appointment booked successfully.';
        this.error = '';

        this.closeModal(form);

        if (res?.appointment) {
          this.appointments = [...this.appointments, res.appointment].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          this.cdr.detectChanges();
        } else {
          this.loadAppointments();
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Submit appointment error:', err);
        this.error = err.error?.message || 'Failed to create appointment';
        this.message = '';
      }
    });
  }

  getAvailableDateSet(): Set<string> {
    return new Set(this.availableDates.map(item => item.date));
  }

  isDateAvailable(date: Date): boolean {
    const dateStr = this.toDateString(date);
    return this.getAvailableDateSet().has(dateStr);
  }

  isSelectedDate(date: Date): boolean {
    return this.newAppointment.date === this.toDateString(date);
  }

  toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  get currentMonthLabel(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  get calendarDays(): any[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: any[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(this.currentYear, this.currentMonth, day);
      const available = this.isDateAvailable(fullDate);

      days.push({
        empty: false,
        day,
        fullDate,
        dateString: this.toDateString(fullDate),
        available,
        selected: this.isSelectedDate(fullDate),
        today: this.toDateString(fullDate) === this.toDateString(new Date())
      });
    }

    return days;
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || '';
  }

  formatTime(slot: string): string {
    const [hourStr, minute] = slot.split(':');
    const hour = Number(hourStr);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${suffix}`;
  }

  formatDate(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}