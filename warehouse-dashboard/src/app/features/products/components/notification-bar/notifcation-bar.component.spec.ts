import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationBarComponent } from './notification-bar.component';
import { NotificationsService } from '../../../../core/services/notifications.service';

describe('NotificationBarComponent', () => {
    let component: NotificationBarComponent;
    let notificationsService: NotificationsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NotificationBarComponent],
        });

        notificationsService = TestBed.inject(NotificationsService);

        const fixture = TestBed.createComponent(NotificationBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // TEST CASE 1 - No inital alert shown
    it('should have no alert on initialisation', () => {
        expect(component.alert()).toBeNull();
        expect(component.isCritical()).toBe(false);
    });

    // TEST CASE 2 - Notifcation to Low Stock Status
    it('should display alert when a product drops to Low Stock', () => {
        notificationsService.notify('Wireless Keyboard is now Low Stock');

        expect(component.alert()).toBe('Wireless Keyboard is now Low Stock');
        expect(component.isCritical()).toBe(false);
    });

    // TEST CASE 3 - Notifcation to Out of Stock Status
    it('should display alert and set isCritical when a product drops to Out of Stock', () => {
        notificationsService.notify('USB Hub 7-Port is now Out of Stock');

        expect(component.alert()).toBe('USB Hub 7-Port is now Out of Stock');
        expect(component.isCritical()).toBe(true);
    });

    // TEST CASE 4 - Clear alert when dismissed
    it('should clear the alert when dismiss is called', () => {
        notificationsService.notify('USB Hub 7-Port is now Out of Stock');
        expect(component.alert()).not.toBeNull();

        component.dismiss();

        expect(component.alert()).toBeNull();
        expect(component.isCritical()).toBe(false);
    });

    // TEST CASE 5 - Correctly update when status changes from Out of Stock to In Stock
    it('should clear critical state when stock recovers to In Stock', () => {
        notificationsService.notify('USB Hub 7-Port is now Out of Stock');
        expect(component.isCritical()).toBe(true);

        notificationsService.clear();
        expect(component.alert()).toBeNull();
        expect(component.isCritical()).toBe(false);
    });
});