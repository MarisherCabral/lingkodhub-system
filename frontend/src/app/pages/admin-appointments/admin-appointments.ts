import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AppointmentService,
  Availability,
  Appointment,
  AppointmentUser
} from '../../services/appointment.service';
import {
  LucideAngularModule,
  Search,
  Filter,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table2
} from 'lucide-angular';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-appointments.html',
  styleUrls: ['./admin-appointments.css']
})
export class AdminAppointments implements OnInit {
  constructor(private appointmentService: AppointmentService) {}

  saving = false;
  updating = false;

  searchText = '';
  filterStatus = 'all';
  viewMode: 'calendar' | 'table' = 'calendar';

  services: string[] = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Business Permit'
  ];

  selectedService = 'Barangay Clearance';
  selectedDateInput = '';
  selectedSlotsText = '09:00,10:00,11:00,13:00,14:00,15:00,16:00';

  availabilityList: Availability[] = [];
  appointments: Appointment[] = [];

  message = '';
  error = '';

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDate: Date = new Date();

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  icons = {
    Search,
    Filter,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Table2
  };

  ngOnInit(): void {
    const admin = JSON.parse(localStorage.getItem('user') || '{}');

    if (!admin?._id || admin?.role !== 'admin') {
      this.error = 'Unauthorized access';
      return;
    }

    this.loadAvailability();
    this.loadAppointments();
  }

  loadAvailability(): void {
    this.appointmentService.getAdminAvailability(this.selectedService).subscribe({
      next: (res: Availability[]) => {
        this.availabilityList = Array.isArray(res) ? res : [];
      },
      error: (err: any) => {
        console.error('GET ADMIN AVAILABILITY ERROR:', err);
        this.error = err?.error?.message || 'Failed to load availability';
        this.availabilityList = [];
      }
    });
  }

  loadAppointments(): void {
    this.appointmentService.getAllAppointments().subscribe({
      next: (res: Appointment[]) => {
        this.appointments = Array.isArray(res) ? res : [];
      },
      error: (err: any) => {
        console.error('GET ALL APPOINTMENTS ERROR:', err);
        this.error = err?.error?.message || 'Failed to load appointments';
        this.appointments = [];
      }
    });
  }

  onServiceChange(): void {
    this.loadAvailability();
  }

  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseSlots(text: string): string[] {
    return [
      ...new Set(
        text
          .split(',')
          .map((slot) => slot.trim())
          .filter((slot) => !!slot)
      )
    ];
  }

  addAvailability(): void {
    if (!this.selectedService || !this.selectedDateInput) {
      this.error = 'Please select service and date.';
      this.message = '';
      return;
    }

    const slots = this.parseSlots(this.selectedSlotsText);

    this.saving = true;
    this.error = '';
    this.message = '';

    this.appointmentService.addAvailability({
      service: this.selectedService,
      date: this.selectedDateInput,
      slots
    }).subscribe({
      next: (res) => {
        this.message = res.message || 'Availability added successfully.';
        this.selectedDateInput = '';
        this.saving = false;
        this.loadAvailability();
      },
      error: (err: any) => {
        console.error('ADD AVAILABILITY ERROR:', err);
        this.error = err?.error?.message || 'Failed to add availability';
        this.saving = false;
      }
    });
  }

  toggleAvailability(item: Availability): void {
    this.updating = true;
    this.error = '';
    this.message = '';

    this.appointmentService.updateAvailability(item._id, {
      isOpen: !item.isOpen
    }).subscribe({
      next: (res) => {
        this.message = res.message || 'Availability updated.';
        this.updating = false;
        this.loadAvailability();
      },
      error: (err: any) => {
        console.error('UPDATE AVAILABILITY ERROR:', err);
        this.error = err?.error?.message || 'Failed to update availability';
        this.updating = false;
      }
    });
  }

  deleteAvailability(id: string): void {
    this.updating = true;
    this.error = '';
    this.message = '';

    this.appointmentService.deleteAvailability(id).subscribe({
      next: (res) => {
        this.message = res.message || 'Availability deleted.';
        this.updating = false;
        this.loadAvailability();
      },
      error: (err: any) => {
        console.error('DELETE AVAILABILITY ERROR:', err);
        this.error = err?.error?.message || 'Failed to delete availability';
        this.updating = false;
      }
    });
  }

  updateStatus(
    appointmentId: string | undefined,
    status: 'approved' | 'completed' | 'rejected'
  ): void {
    if (!appointmentId) return;

    this.updating = true;
    this.error = '';
    this.message = '';

    this.appointmentService.updateAppointmentStatus(appointmentId, status).subscribe({
      next: (res) => {
        this.message = res.message || 'Appointment updated successfully.';

        const index = this.appointments.findIndex((a) => a._id === appointmentId);
        if (index !== -1) {
          this.appointments[index] = res.appointment;
          this.appointments = [...this.appointments];
        }

        this.updating = false;
      },
      error: (err: any) => {
        console.error('UPDATE APPOINTMENT STATUS ERROR:', err);
        this.error = err?.error?.message || 'Failed to update appointment status';
        this.updating = false;
      }
    });
  }

  getAppointmentUser(userId: string | AppointmentUser): AppointmentUser | null {
    return typeof userId === 'object' && userId !== null ? userId : null;
  }

  getUserFullName(appt: Appointment): string {
    const user = this.getAppointmentUser(appt.userId);
    return user?.fullName || 'Unknown User';
  }

  getUserEmail(appt: Appointment): string {
    const user = this.getAppointmentUser(appt.userId);
    return user?.email || 'No email';
  }

  getUserRole(appt: Appointment): string {
    const user = this.getAppointmentUser(appt.userId);
    return user?.role || 'resident';
  }

  get filteredAppointments(): Appointment[] {
    const search = this.searchText.trim().toLowerCase();

    return this.appointments.filter((appt) => {
      const matchesStatus =
        this.filterStatus === 'all' || (appt.status || '') === this.filterStatus;

      const fullName = this.getUserFullName(appt).toLowerCase();
      const email = this.getUserEmail(appt).toLowerCase();
      const service = (appt.service || '').toLowerCase();
      const notes = (appt.notes || '').toLowerCase();
      const time = (appt.time || '').toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        email.includes(search) ||
        service.includes(search) ||
        notes.includes(search) ||
        time.includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  get selectedDateAppointments(): Appointment[] {
    return this.filteredAppointments
      .filter((appt) => this.isSameDate(new Date(appt.date), this.selectedDate))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
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
      const dayAppointments = this.appointmentsForDate(fullDate);

      days.push({
        empty: false,
        day,
        fullDate,
        appointments: dayAppointments,
        hasAppointments: dayAppointments.length > 0,
        hasPending: dayAppointments.some((a) => a.status === 'pending'),
        hasApproved: dayAppointments.some((a) => a.status === 'approved'),
        hasCompleted: dayAppointments.some((a) => a.status === 'completed'),
        hasRejected: dayAppointments.some((a) => a.status === 'rejected'),
        isSelected: this.isSameDate(fullDate, this.selectedDate),
        isToday: this.isSameDate(fullDate, new Date())
      });
    }

    return days;
  }

  appointmentsForDate(date: Date): Appointment[] {
    return this.filteredAppointments.filter((appt) =>
      this.isSameDate(new Date(appt.date), date)
    );
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(date);
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

  isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
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

  getStatusClass(status?: string): string {
    return (status || '').toLowerCase();
  }

  getInitials(name?: string): string {
    if (!name) return 'U';

    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}