import { createAbstraction } from "@webiny/feature/admin";
import type { Notification, NotificationCounts, NotificationsMeta } from "~/types.js";

export interface IListNotificationsParams {
    archived?: boolean;
    read?: boolean;
    limit?: number;
    after?: string | null;
}

export interface IListNotificationsResult {
    items: Notification[];
    meta: NotificationsMeta;
}

export interface INotificationsApi {
    list(params: IListNotificationsParams): Promise<IListNotificationsResult>;
    counts(): Promise<NotificationCounts>;
    markRead(id: string): Promise<Notification>;
    markAllRead(): Promise<number>;
    archive(id: string): Promise<Notification>;
    unarchive(id: string): Promise<Notification>;
}

export const NotificationsGateway = createAbstraction<INotificationsApi>("Notifications/Gateway");
export namespace NotificationsGateway {
    export type Interface = INotificationsApi;
}

export const NotificationsApi = createAbstraction<INotificationsApi>("Notifications/Api");
export namespace NotificationsApi {
    export type Interface = INotificationsApi;
    export type ListParams = IListNotificationsParams;
    export type ListResult = IListNotificationsResult;
}
