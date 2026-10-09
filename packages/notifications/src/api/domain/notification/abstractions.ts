import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { IMeta } from "~/api/types.js";

export enum NotificationType {
    mention = "mention",
    reply = "reply",
    reviewRequested = "reviewRequested",
    approved = "approved",
    rejected = "rejected"
}

export interface NotificationIdentity {
    id: string;
    displayName: string;
    type: string;
}

/**
 * Where the notification points — enough for the admin to deep-link.
 */
export interface NotificationLink {
    app?: string | null;
    contentType?: string | null;
    contentId?: string | null;
    locator?: string | null;
    threadId?: string | null;
}

export interface INotificationValues {
    recipientId: string;
    type: NotificationType;
    actor: NotificationIdentity;
    title: string;
    snippet?: string | null;
    link?: NotificationLink | null;
    read: boolean;
    readOn?: string | null;
    archived: boolean;
    archivedOn?: string | null;
}

export interface INotification extends INotificationValues {
    id: string;
    createdOn: string;
}

export interface INotificationWhere {
    recipientId: string;
    archived?: boolean;
    read?: boolean;
}

export interface INotificationListParams {
    where: INotificationWhere;
    limit?: number;
    after?: string | null;
}

export interface INotificationListResult {
    items: INotification[];
    meta: IMeta;
}

export interface INotificationMapper {
    fromCmsEntry(entry: CmsEntry<INotificationValues>): INotification;
}
export const NotificationMapper = createAbstraction<INotificationMapper>("NotificationMapper");
export namespace NotificationMapper {
    export type Interface = INotificationMapper;
}
