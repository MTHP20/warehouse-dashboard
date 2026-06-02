import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationBarComponent } from "./features/products/components/notification-bar/notification-bar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  protected readonly title = signal('warehouse-dashboard');
}
