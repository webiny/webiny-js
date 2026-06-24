import { makeAutoObservable } from "mobx";
import {
    NotificationService as Abstraction,
    type INotification,
    type INotificationInput
} from "./abstractions.js";

class NotificationServiceImpl implements Abstraction.Interface {
    private notifications: INotification[] = [];
    private counter = 0;

    constructor() {
        makeAutoObservable(this);
    }

    add(input: INotificationInput): void {
        this.counter++;
        this.notifications.push({ id: `notification-${this.counter}`, ...input });
    }

    getNotifications(): INotification[] {
        return this.notifications;
    }

    remove(id: string): void {
        this.notifications = this.notifications.filter(notification => notification.id !== id);
    }
}

export const NotificationService = Abstraction.createImplementation({
    implementation: NotificationServiceImpl,
    dependencies: []
});
