import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { NotificationsGateway as GatewayAbstraction } from "./abstractions.js";
import type { IListNotificationsParams, IListNotificationsResult } from "./abstractions.js";
import type { Notification, NotificationCounts, NotificationsMeta } from "~/types.js";

interface GqlError {
    code: string;
    message: string;
    data?: unknown;
}

const unwrap = <T>(envelope: { data: T | null; error: GqlError | null }): T => {
    if (envelope.error) {
        throw new Error(envelope.error.message);
    }
    return envelope.data as T;
};

const NOTIFICATION_FIELDS = /* GraphQL */ `
    {
        id
        type
        actor {
            id
            displayName
            type
        }
        title
        snippet
        link {
            app
            contentType
            contentId
            locator
            threadId
        }
        read
        readOn
        archived
        archivedOn
        createdOn
    }
`;

const LIST_QUERY = /* GraphQL */ `
    query ListNotifications($where: ListNotificationsWhereInput, $limit: Int, $after: String) {
        notifications {
            listNotifications(where: $where, limit: $limit, after: $after) {
                data ${NOTIFICATION_FIELDS}
                meta { totalCount hasMoreItems cursor }
                error { code message }
            }
        }
    }
`;

const COUNTS_QUERY = /* GraphQL */ `
    query NotificationCounts {
        notifications {
            notificationCounts {
                data {
                    inbox
                    archive
                    unread
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const MARK_READ = /* GraphQL */ `
    mutation MarkNotificationRead($id: ID!) {
        notifications { markNotificationRead(id: $id) { data ${NOTIFICATION_FIELDS} error { code message } } }
    }
`;

const MARK_ALL_READ = /* GraphQL */ `
    mutation MarkAllNotificationsRead {
        notifications {
            markAllNotificationsRead {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const ARCHIVE = /* GraphQL */ `
    mutation ArchiveNotification($id: ID!) {
        notifications { archiveNotification(id: $id) { data ${NOTIFICATION_FIELDS} error { code message } } }
    }
`;

const UNARCHIVE = /* GraphQL */ `
    mutation UnarchiveNotification($id: ID!) {
        notifications { unarchiveNotification(id: $id) { data ${NOTIFICATION_FIELDS} error { code message } } }
    }
`;

class NotificationsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list(params: IListNotificationsParams): Promise<IListNotificationsResult> {
        const response = await this.client.execute<{
            notifications: {
                listNotifications: {
                    data: Notification[] | null;
                    meta: NotificationsMeta | null;
                    error: GqlError | null;
                };
            };
        }>({
            query: LIST_QUERY,
            variables: {
                where: { archived: params.archived, read: params.read },
                limit: params.limit,
                after: params.after
            }
        });
        const envelope = response.notifications.listNotifications;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }
        return {
            items: envelope.data || [],
            meta: envelope.meta || { totalCount: 0, hasMoreItems: false, cursor: null }
        };
    }

    async counts(): Promise<NotificationCounts> {
        const response = await this.client.execute<{
            notifications: {
                notificationCounts: { data: NotificationCounts | null; error: GqlError | null };
            };
        }>({ query: COUNTS_QUERY });
        return unwrap(response.notifications.notificationCounts);
    }

    async markRead(id: string): Promise<Notification> {
        const response = await this.client.execute<{
            notifications: {
                markNotificationRead: { data: Notification | null; error: GqlError | null };
            };
        }>({ query: MARK_READ, variables: { id } });
        return unwrap(response.notifications.markNotificationRead);
    }

    async markAllRead(): Promise<number> {
        const response = await this.client.execute<{
            notifications: {
                markAllNotificationsRead: { data: number | null; error: GqlError | null };
            };
        }>({ query: MARK_ALL_READ });
        return unwrap(response.notifications.markAllNotificationsRead) ?? 0;
    }

    async archive(id: string): Promise<Notification> {
        const response = await this.client.execute<{
            notifications: {
                archiveNotification: { data: Notification | null; error: GqlError | null };
            };
        }>({ query: ARCHIVE, variables: { id } });
        return unwrap(response.notifications.archiveNotification);
    }

    async unarchive(id: string): Promise<Notification> {
        const response = await this.client.execute<{
            notifications: {
                unarchiveNotification: { data: Notification | null; error: GqlError | null };
            };
        }>({ query: UNARCHIVE, variables: { id } });
        return unwrap(response.notifications.unarchiveNotification);
    }
}

export const NotificationsGateway = GatewayAbstraction.createImplementation({
    implementation: NotificationsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
