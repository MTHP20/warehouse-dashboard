import { Component, computed, effect, Signal, ViewEncapsulation } from '@angular/core';
import { NotificationsService } from '../../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-bar',
  imports: [],
  templateUrl: './notification-bar.component.html',
  styleUrl: './notification-bar.component.scss',
  // Web Component
  encapsulation: ViewEncapsulation.ShadowDom
})
export class NotificationBarComponent {
  alert!: Signal<string | null>;
  isCritical!: Signal<boolean>;

  constructor(public notificationsService: NotificationsService) {
    this.alert = this.notificationsService.currentAlert;

    this.isCritical = computed(() =>
      this.alert()?.includes('Out of Stock') ?? false
    );

    effect(() => {
      const a = this.alert();
      if (a) console.info('[Notification Bar]', a);
    });
  }

  dismiss(): void {
    this.notificationsService.clear();
  }
}
