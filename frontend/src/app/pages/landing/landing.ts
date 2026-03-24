import { Component } from '@angular/core';
import { LucideAngularModule, FileText, Clock, Shield } from 'lucide-angular';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    Navbar,
    Footer,
    LucideAngularModule   // ✅ ADD THIS
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {
  icons = { FileText, Clock, Shield };
}