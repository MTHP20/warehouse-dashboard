import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  currentAlert = signal<string | null>(null);

  notify(message: string): void {
    this.currentAlert.set(message);
  }

  clear(): void {
    this.currentAlert.set(null);
  }
}
