export type NotificationType = "mention" | "reply" | "reviewRequested" | "approved" | "rejected";

export interface NotificationActor {
    id: string;
    displayName?: string | null;
    type?: string | null;
}

export interface NotificationLink {
    app?: string | null;
    contentType?: string | null;
    contentId?: string | null;
    locator?: string | null;
    threadId?: string | null;
}

export interface Notification {
    id: string;
    type: NotificationType;
    actor: NotificationActor;
    title?: string | null;
    snippet?: string | null;
    link?: NotificationLink | null;
    read: boolean;
    readOn?: string | null;
    archived: boolean;
    archivedOn?: string | null;
    createdOn: string;
}

export interface NotificationCounts {
    inbox: number;
    archive: number;
    unread: number;
}

export interface NotificationsMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}
