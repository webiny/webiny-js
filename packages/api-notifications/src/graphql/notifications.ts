import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { NotFoundError, resolve, resolveList } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import { ListNotificationsUseCase } from "~/features/ListNotifications/index.js";
import { NotificationCountsUseCase } from "~/features/NotificationCounts/index.js";
import {
    MarkAllNotificationsReadUseCase,
    MarkNotificationReadUseCase
} from "~/features/MarkNotifications/index.js";
import {
    ArchiveNotificationUseCase,
    UnarchiveNotificationUseCase
} from "~/features/ArchiveNotifications/index.js";
import { listNotificationsValidation, idValidation } from "./validation.js";

interface IIdArgs {
    id: string;
}

interface IListNotificationsArgs {
    where?: {
        archived?: boolean;
        read?: boolean;
    };
    limit?: number;
    after?: string;
}

class NotificationsSchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type NotificationError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            enum NotificationTypeValue {
                mention
                reply
                reviewRequested
                approved
                rejected
            }

            type NotificationActor {
                id: String!
                displayName: String
                type: String
            }

            type NotificationLink {
                app: String
                contentType: String
                contentId: String
                locator: String
                threadId: String
            }

            type Notification {
                id: ID!
                type: NotificationTypeValue!
                actor: NotificationActor!
                title: String
                snippet: String
                link: NotificationLink
                read: Boolean!
                readOn: String
                archived: Boolean!
                archivedOn: String
                createdOn: String!
            }

            type NotificationCounts {
                inbox: Int!
                archive: Int!
                unread: Int!
            }

            type NotificationListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type ListNotificationsResponse {
                data: [Notification!]
                meta: NotificationListMeta
                error: NotificationError
            }

            type NotificationResponse {
                data: Notification
                error: NotificationError
            }

            type NotificationCountsResponse {
                data: NotificationCounts
                error: NotificationError
            }

            type NotificationCountResponse {
                data: Int
                error: NotificationError
            }

            input ListNotificationsWhereInput {
                archived: Boolean
                read: Boolean
            }

            type NotificationsQuery {
                listNotifications(
                    where: ListNotificationsWhereInput
                    limit: Int
                    after: String
                ): ListNotificationsResponse!
                notificationCounts: NotificationCountsResponse!
            }

            type NotificationsMutation {
                markNotificationRead(id: ID!): NotificationResponse!
                markAllNotificationsRead: NotificationCountResponse!
                archiveNotification(id: ID!): NotificationResponse!
                unarchiveNotification(id: ID!): NotificationResponse!
            }

            extend type Query {
                notifications: NotificationsQuery
            }

            extend type Mutation {
                notifications: NotificationsMutation
            }
        `);

        builder.addResolver({
            path: "Query.notifications",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.notifications",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<IListNotificationsArgs>({
            path: "NotificationsQuery.listNotifications",
            dependencies: [ListNotificationsUseCase],
            resolver: (listNotifications: ListNotificationsUseCase.Interface) => {
                return async ({ args }) => {
                    return resolveList(async () => {
                        const result = await listNotificationsValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listResult = await listNotifications.execute({
                            archived: result.data.where?.archived,
                            read: result.data.where?.read,
                            limit: result.data.limit,
                            after: result.data.after
                        });

                        if (listResult.isFail()) {
                            throw listResult.error;
                        }

                        return listResult.value;
                    });
                };
            }
        });

        builder.addResolver({
            path: "NotificationsQuery.notificationCounts",
            dependencies: [NotificationCountsUseCase],
            resolver: (counts: NotificationCountsUseCase.Interface) => {
                return async () => {
                    return resolve(async () => {
                        const result = await counts.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "NotificationsMutation.markNotificationRead",
            dependencies: [MarkNotificationReadUseCase],
            resolver: (markRead: MarkNotificationReadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        const markResult = await markRead.execute(result.data.id);
                        if (markResult.isFail()) {
                            if (markResult.error.code === "Notifications/NotFound") {
                                throw new NotFoundError(markResult.error.message);
                            }
                            throw markResult.error;
                        }
                        return markResult.value;
                    });
                };
            }
        });

        builder.addResolver({
            path: "NotificationsMutation.markAllNotificationsRead",
            dependencies: [MarkAllNotificationsReadUseCase],
            resolver: (markAll: MarkAllNotificationsReadUseCase.Interface) => {
                return async () => {
                    return resolve(async () => {
                        const result = await markAll.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "NotificationsMutation.archiveNotification",
            dependencies: [ArchiveNotificationUseCase],
            resolver: (archive: ArchiveNotificationUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        const archiveResult = await archive.execute(result.data.id);
                        if (archiveResult.isFail()) {
                            throw archiveResult.error;
                        }
                        return archiveResult.value;
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "NotificationsMutation.unarchiveNotification",
            dependencies: [UnarchiveNotificationUseCase],
            resolver: (unarchive: UnarchiveNotificationUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }
                        const unarchiveResult = await unarchive.execute(result.data.id);
                        if (unarchiveResult.isFail()) {
                            throw unarchiveResult.error;
                        }
                        return unarchiveResult.value;
                    });
                };
            }
        });

        return builder;
    }
}

export const NotificationsSchema = GraphQLSchemaFactory.createImplementation({
    implementation: NotificationsSchema_,
    dependencies: []
});
