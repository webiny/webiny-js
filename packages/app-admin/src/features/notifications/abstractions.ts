import { createAbstraction } from "@webiny/feature/admin";

export type NotificationVariant = "default" | "success" | "warning" | "error";

export type NotificationPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

export interface INotificationLink {
    label: string;
    url: string;
}

export interface INotificationInput {
    title: string;
    description?: string;
    link?: INotificationLink;
    duration?: number;
    position?: NotificationPosition;
    dismissible?: boolean;
}

export interface INotification extends INotificationInput {
    id: string;
    variant: NotificationVariant;
}

/**
 * App-wide notification queue. Any feature can inject this and call `notify()` / `success()` /
 * `warning()` / `error()` to surface a notification on screen, without depending on React or the
 * toast UI.
 */
export interface INotifications {
    notify(notification: INotificationInput): void;
    success(notification: INotificationInput): void;
    warning(notification: INotificationInput): void;
    error(notification: INotificationInput): void;
    getNotifications(): INotification[];
    remove(id: string): void;
}

export const Notifications = createAbstraction<INotifications>("Notifications");

export namespace Notifications {
    export type Interface = INotifications;
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
