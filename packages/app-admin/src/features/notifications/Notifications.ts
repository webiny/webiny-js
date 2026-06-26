import { makeAutoObservable } from "mobx";
import {
    Notifications as Abstraction,
    type INotification,
    type INotificationInput,
    type NotificationVariant
} from "./abstractions.js";

class NotificationsImpl implements Abstraction.Interface {
    private notifications: INotification[] = [];
    private counter = 0;

    constructor() {
        makeAutoObservable(this);
    }

    notify(input: INotificationInput): void {
        this.push(input, "default");
    }

    success(input: INotificationInput): void {
        this.push(input, "success");
    }

    warning(input: INotificationInput): void {
        this.push(input, "warning");
    }

    getNotifications(): INotification[] {
        return this.notifications;
    }

    remove(id: string): void {
        this.notifications = this.notifications.filter(notification => notification.id !== id);
    }

    private push(input: INotificationInput, variant: NotificationVariant): void {
        this.counter++;
        this.notifications.push({ id: `notification-${this.counter}`, variant, ...input });
    }
}

export const Notifications = Abstraction.createImplementation({
    implementation: NotificationsImpl,
    dependencies: []
});
