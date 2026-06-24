import { createAbstraction } from "@webiny/feature/admin";

export type NotificationVariant = "default" | "success" | "warning" | "error";

export interface INotificationInput {
    title: string;
    description?: string;
    variant?: NotificationVariant;
}

export interface INotification extends INotificationInput {
    id: string;
}

/**
 * App-wide notification queue. Any feature can inject this and call `add(...)` to surface a
 * notification on screen, without depending on React or the toast UI directly.
 */
export interface INotificationService {
    add(notification: INotificationInput): void;
    getNotifications(): INotification[];
    remove(id: string): void;
}

export const NotificationService = createAbstraction<INotificationService>("NotificationService");

export namespace NotificationService {
    export type Interface = INotificationService;
}

export interface INotificationsViewModel {
    notifications: INotification[];
}

/**
 * Presents queued notifications (oldest first) to the UI layer, which renders them in order.
 */
export interface INotificationsPresenter {
    readonly vm: INotificationsViewModel;
    markShown(id: string): void;
}

export const NotificationsPresenter =
    createAbstraction<INotificationsPresenter>("NotificationsPresenter");

export namespace NotificationsPresenter {
    export type Interface = INotificationsPresenter;
}
