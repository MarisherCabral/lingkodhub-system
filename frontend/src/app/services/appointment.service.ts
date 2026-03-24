import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Availability {
  _id: string;
  service: string;
  date: string;
  slots: string[];
  isOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentUser {
  _id?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export interface Appointment {
  _id?: string;
  userId: string | AppointmentUser;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilityResponse {
  message: string;
  availability: Availability;
}

export interface MessageResponse {
  message: string;
}

export interface AvailableSlotsResponse {
  bookedTimes: string[];
  availableSlots: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = 'http://localhost:5000/api/appointments';

  constructor(private http: HttpClient) {}

  getAdminAvailability(service?: string): Observable<Availability[]> {
    let url = `${this.baseUrl}/admin/availability`;
    if (service) {
      url += `?service=${encodeURIComponent(service)}`;
    }
    return this.http.get<Availability[]>(url);
  }

  addAvailability(payload: {
    service: string;
    date: string;
    slots?: string[];
  }): Observable<AvailabilityResponse> {
    return this.http.post<AvailabilityResponse>(
      `${this.baseUrl}/admin/availability`,
      payload
    );
  }

  updateAvailability(
    id: string,
    payload: { isOpen?: boolean; slots?: string[] }
  ): Observable<AvailabilityResponse> {
    return this.http.patch<AvailabilityResponse>(
      `${this.baseUrl}/admin/availability/${id}`,
      payload
    );
  }

  deleteAvailability(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.baseUrl}/admin/availability/${id}`
    );
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/admin/list`);
  }

  updateAppointmentStatus(
    id: string,
    status: 'approved' | 'completed' | 'rejected'
  ): Observable<{ message: string; appointment: Appointment }> {
    return this.http.put<{ message: string; appointment: Appointment }>(
      `${this.baseUrl}/admin/${id}/status`,
      { status }
    );
  }

  getAvailableDates(service: string): Observable<Availability[]> {
    return this.http.get<Availability[]>(
      `${this.baseUrl}/available?service=${encodeURIComponent(service)}`
    );
  }

  getAvailableSlots(service: string, date: string): Observable<AvailableSlotsResponse> {
    return this.http.get<AvailableSlotsResponse>(
      `${this.baseUrl}/availability/${encodeURIComponent(service)}/${date}`
    );
  }

  createAppointment(payload: {
    userId: string;
    service: string;
    date: string;
    time: string;
    notes?: string;
  }): Observable<{ message: string; appointment: Appointment }> {
    return this.http.post<{ message: string; appointment: Appointment }>(
      `${this.baseUrl}`,
      payload
    );
  }

  getUserAppointments(userId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/user/${userId}`);
  }
}