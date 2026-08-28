import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { NotFoundError, resolve, resolveList } from "@webiny/handler-graphql";
import { createZodError } from "@webiny/utils";
import { CollabThreadType } from "~/domain/thread/abstractions.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";
import { CreateThreadUseCase } from "~/features/thread/CreateThread/index.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { ListThreadsUseCase } from "~/features/thread/ListThreads/index.js";
import { ReplyToThreadUseCase } from "~/features/thread/ReplyToThread/index.js";
import {
    ReopenThreadUseCase,
    ResolveThreadUseCase
} from "~/features/thread/ThreadResolution/index.js";
import {
    DeleteMessageUseCase,
    UpdateMessageUseCase
} from "~/features/thread/MessageOperations/index.js";
import { DeleteThreadUseCase } from "~/features/thread/DeleteThread/index.js";
import {
    createCollabThreadValidation,
    deleteCollabMessageValidation,
    getCollabThreadValidation,
    idOnlyValidation,
    listCollabThreadsValidation,
    replyToCollabThreadValidation,
    updateCollabMessageValidation
} from "./validation.js";

const toGqlThread = (view: ICollabThreadView) => {
    return { ...view.thread, anchor: view.anchor };
};

interface IIdArgs {
    id: string;
}

interface IListCollabThreadsArgs {
    where: {
        contentType: string;
        contentId: string;
        type?: string;
        resolved?: boolean;
    };
    limit?: number;
    after?: string;
}

interface ICreateCollabThreadArgs {
    input: {
        contentType: string;
        contentId: string;
        locator: string;
        type: string;
        body: string;
        mentions?: string[];
        assigneeId?: string;
        dueDate?: string;
    };
}

interface IReplyToCollabThreadArgs {
    threadId: string;
    body: string;
    mentions?: string[];
}

interface IUpdateCollabMessageArgs {
    threadId: string;
    messageId: string;
    body: string;
}

interface IDeleteCollabMessageArgs {
    threadId: string;
    messageId: string;
}

class CollaborationSchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type CollabError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            enum CollabThreadType {
                note
                task
            }

            type CollabIdentity {
                id: String!
                displayName: String
                type: String
            }

            type CollabMessage {
                id: String!
                body: String!
                mentions: [String!]!
                createdBy: CollabIdentity!
                createdOn: String!
                deleted: Boolean
                deletedBy: CollabIdentity
                deletedOn: String
            }

            type CollabAnchor {
                exists: Boolean!
                authorized: Boolean!
                label: String
                path: [String!]
            }

            type CollabThread {
                id: ID!
                contentType: String!
                contentId: String!
                locator: String!
                type: CollabThreadType!
                resolved: Boolean!
                resolvedBy: CollabIdentity
                resolvedOn: String
                assigneeId: String
                dueDate: String
                messages: [CollabMessage!]!
                createdBy: CollabIdentity!
                createdOn: String!
                anchor: CollabAnchor!
            }

            type CollabThreadListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type GetCollabThreadResponse {
                data: CollabThread
                error: CollabError
            }

            type ListCollabThreadsResponse {
                data: [CollabThread!]
                meta: CollabThreadListMeta
                error: CollabError
            }

            type CollabThreadResponse {
                data: CollabThread
                error: CollabError
            }

            type CollabMessageResponse {
                data: CollabMessage
                error: CollabError
            }

            type CollabBooleanResponse {
                data: Boolean
                error: CollabError
            }

            input ListCollabThreadsWhereInput {
                contentType: String!
                contentId: String!
                type: CollabThreadType
                resolved: Boolean
            }

            input CreateCollabThreadInput {
                contentType: String!
                contentId: String!
                locator: String!
                type: CollabThreadType!
                body: String!
                mentions: [String!]
                assigneeId: String
                dueDate: String
            }

            type CollaborationQuery {
                listCollabThreads(
                    where: ListCollabThreadsWhereInput!
                    limit: Int
                    after: String
                ): ListCollabThreadsResponse!
                getCollabThread(id: ID!): GetCollabThreadResponse!
            }

            type CollaborationMutation {
                createCollabThread(input: CreateCollabThreadInput!): CollabThreadResponse!
                replyToCollabThread(
                    threadId: ID!
                    body: String!
                    mentions: [String!]
                ): CollabMessageResponse!
                resolveCollabThread(id: ID!): CollabThreadResponse!
                reopenCollabThread(id: ID!): CollabThreadResponse!
                updateCollabMessage(
                    threadId: ID!
                    messageId: ID!
                    body: String!
                ): CollabMessageResponse!
                deleteCollabMessage(threadId: ID!, messageId: ID!): CollabBooleanResponse!
                deleteCollabThread(id: ID!): CollabBooleanResponse!
            }

            extend type Query {
                collaboration: CollaborationQuery
            }

            extend type Mutation {
                collaboration: CollaborationMutation
            }
        `);

        builder.addResolver({
            path: "Query.collaboration",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.collaboration",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<IIdArgs>({
            path: "CollaborationQuery.getCollabThread",
            dependencies: [GetThreadUseCase],
            resolver: (getThread: GetThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await getCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const threadResult = await getThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw new NotFoundError(threadResult.error.message);
                        }

                        return toGqlThread(threadResult.value);
                    });
                };
            }
        });

        builder.addResolver<IListCollabThreadsArgs>({
            path: "CollaborationQuery.listCollabThreads",
            dependencies: [ListThreadsUseCase],
            resolver: (listThreads: ListThreadsUseCase.Interface) => {
                return async ({ args }) => {
                    return resolveList(async () => {
                        const result = await listCollabThreadsValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listResult = await listThreads.execute({
                            where: {
                                contentType: result.data.where.contentType,
                                contentId: result.data.where.contentId,
                                type: result.data.where.type as CollabThreadType | undefined,
                                resolved: result.data.where.resolved
                            },
                            limit: result.data.limit,
                            after: result.data.after
                        });

                        if (listResult.isFail()) {
                            throw listResult.error;
                        }

                        return {
                            items: listResult.value.items.map(toGqlThread),
                            meta: listResult.value.meta
                        };
                    });
                };
            }
        });

        builder.addResolver<ICreateCollabThreadArgs>({
            path: "CollaborationMutation.createCollabThread",
            dependencies: [CreateThreadUseCase],
            resolver: (createThread: CreateThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await createCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const createResult = await createThread.execute({
                            contentType: result.data.input.contentType,
                            contentId: result.data.input.contentId,
                            locator: result.data.input.locator,
                            type: result.data.input.type as CollabThreadType,
                            body: result.data.input.body,
                            mentions: result.data.input.mentions,
                            assigneeId: result.data.input.assigneeId,
                            dueDate: result.data.input.dueDate
                        });

                        if (createResult.isFail()) {
                            throw createResult.error;
                        }

                        return toGqlThread(createResult.value);
                    });
                };
            }
        });

        builder.addResolver<IReplyToCollabThreadArgs>({
            path: "CollaborationMutation.replyToCollabThread",
            dependencies: [ReplyToThreadUseCase],
            resolver: (reply: ReplyToThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await replyToCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const replyResult = await reply.execute({
                            threadId: result.data.threadId,
                            body: result.data.body,
                            mentions: result.data.mentions
                        });

                        if (replyResult.isFail()) {
                            throw replyResult.error;
                        }

                        return replyResult.value;
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "CollaborationMutation.resolveCollabThread",
            dependencies: [ResolveThreadUseCase],
            resolver: (resolveThread: ResolveThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const threadResult = await resolveThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw threadResult.error;
                        }

                        return toGqlThread(threadResult.value);
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "CollaborationMutation.reopenCollabThread",
            dependencies: [ReopenThreadUseCase],
            resolver: (reopenThread: ReopenThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const threadResult = await reopenThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw threadResult.error;
                        }

                        return toGqlThread(threadResult.value);
                    });
                };
            }
        });

        builder.addResolver<IUpdateCollabMessageArgs>({
            path: "CollaborationMutation.updateCollabMessage",
            dependencies: [UpdateMessageUseCase],
            resolver: (updateMessage: UpdateMessageUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await updateCollabMessageValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const messageResult = await updateMessage.execute({
                            threadId: result.data.threadId,
                            messageId: result.data.messageId,
                            body: result.data.body
                        });

                        if (messageResult.isFail()) {
                            throw messageResult.error;
                        }

                        return messageResult.value;
                    });
                };
            }
        });

        builder.addResolver<IDeleteCollabMessageArgs>({
            path: "CollaborationMutation.deleteCollabMessage",
            dependencies: [DeleteMessageUseCase],
            resolver: (deleteMessage: DeleteMessageUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await deleteCollabMessageValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const deleteResult = await deleteMessage.execute({
                            threadId: result.data.threadId,
                            messageId: result.data.messageId
                        });

                        if (deleteResult.isFail()) {
                            throw deleteResult.error;
                        }

                        return true;
                    });
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "CollaborationMutation.deleteCollabThread",
            dependencies: [DeleteThreadUseCase],
            resolver: (deleteThread: DeleteThreadUseCase.Interface) => {
                return async ({ args }) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const deleteResult = await deleteThread.execute(result.data.id);

                        if (deleteResult.isFail()) {
                            throw deleteResult.error;
                        }

                        return true;
                    });
                };
            }
        });

        return builder;
    }
}

export const CollaborationSchema = GraphQLSchemaFactory.createImplementation({
    implementation: CollaborationSchema_,
    dependencies: []
});
