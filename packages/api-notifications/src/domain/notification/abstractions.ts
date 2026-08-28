import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import type { IMeta } from "~/types.js";
import type { NotificationNotFoundError, NotificationPersistenceError } from "./errors.js";

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

/**
 * Persistence for notifications. All operations run without CMS authorization (notifications are
 * system-managed rows); access control is enforced by the use cases via `recipientId`.
 */
export interface INotificationRepository {
    create(
        values: INotificationValues
    ): Promise<Result<INotification, NotificationPersistenceError>>;
    list(
        params: INotificationListParams
    ): Promise<Result<INotificationListResult, NotificationPersistenceError>>;
    count(where: INotificationWhere): Promise<Result<number, NotificationPersistenceError>>;
    getById(
        id: string
    ): Promise<Result<INotification, NotificationNotFoundError | NotificationPersistenceError>>;
    save(
        notification: INotification
    ): Promise<Result<INotification, NotificationNotFoundError | NotificationPersistenceError>>;
}

export const NotificationModel = createAbstraction<CmsModel>("NotificationModel");
export namespace NotificationModel {
    export type Interface = CmsModel;
}

export interface INotificationMapper {
    fromCmsEntry(entry: CmsEntry<INotificationValues>): INotification;
}
export const NotificationMapper = createAbstraction<INotificationMapper>("NotificationMapper");
export namespace NotificationMapper {
    export type Interface = INotificationMapper;
}

export const NotificationRepository =
    createAbstraction<INotificationRepository>("NotificationRepository");
export namespace NotificationRepository {
    export type Interface = INotificationRepository;
    export type Where = INotificationWhere;
    export type ListParams = INotificationListParams;
    export type ListResult = INotificationListResult;
}
