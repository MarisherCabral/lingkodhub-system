import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  CalendarDays,
  CircleUserRound,
  LogOut
} from 'lucide-angular';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './user-layout.html',
  styleUrls: ['./user-layout.css']
})
export class UserLayout {
  isSidebarOpen = false;

  icons = {
    Menu,
    X,
    LayoutDashboard,
    FileText,
    CalendarDays,
    CircleUserRound,
    LogOut
  };

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/']);
    this.closeSidebar();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.isSidebarOpen = false;
    }
  }
}