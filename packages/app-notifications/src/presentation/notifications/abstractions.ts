import { createAbstraction } from "@webiny/feature/admin";
import type { Notification, NotificationCounts } from "~/types.js";

export type NotificationsTab = "inbox" | "archive";

export interface INotificationsViewModel {
    open: boolean;
    loading: boolean;
    error: string | null;
    tab: NotificationsTab;
    unreadOnly: boolean;
    counts: NotificationCounts;
    items: Notification[];
}

export interface INotificationsPresenter {
    readonly vm: INotificationsViewModel;
    init(): Promise<void>;
    openPanel(): void;
    closePanel(): void;
    togglePanel(): void;
    setTab(tab: NotificationsTab): void;
    setUnreadOnly(value: boolean): void;
    reload(): Promise<void>;
    /** Reload the current list and refresh the inbox/archive/unread counts. */
    refresh(): Promise<void>;
    markRead(id: string): Promise<void>;
    markAllRead(): Promise<void>;
    archive(id: string): Promise<void>;
}

export const NotificationsPresenter =
    createAbstraction<INotificationsPresenter>("Notifications/Presenter");

export namespace NotificationsPresenter {
    export type Interface = INotificationsPresenter;
    export type ViewModel = INotificationsViewModel;
    export type Tab = NotificationsTab;
}
