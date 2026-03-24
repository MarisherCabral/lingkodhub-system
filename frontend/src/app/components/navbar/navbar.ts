import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // ✅ ADD THIS

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink], // ✅ REQUIRED
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {}