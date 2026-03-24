import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './request.html',
  styleUrls: ['./request.css']
})
export class Request {

  constructor(private http: HttpClient) {}

  request = {
    type: '',
    purpose: ''
  };

  submitRequest() {

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const data = {
      ...this.request,
      userId: user._id
    };

    this.http.post('http://localhost:5000/api/requests', data)
      .subscribe({
        next: () => {
          alert('Request submitted!');
          this.request = { type: '', purpose: '' };
        },
        error: () => {
          alert('Failed to submit request');
        }
      });
  }
}