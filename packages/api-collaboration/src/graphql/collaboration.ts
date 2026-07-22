import { GraphQLSchemaPlugin, NotFoundError, resolve, resolveList } from "@webiny/handler-graphql";
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

export const createCollaborationSchema = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
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
        `,
        resolvers: {
            Query: {
                collaboration: () => ({})
            },
            Mutation: {
                collaboration: () => ({})
            },
            CollaborationQuery: {
                getCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await getCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const getThread = context.container.resolve(GetThreadUseCase);
                        const threadResult = await getThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw new NotFoundError(threadResult.error.message);
                        }

                        return toGqlThread(threadResult.value);
                    });
                },
                listCollabThreads: async (_, args, context) => {
                    return resolveList(async () => {
                        const result = await listCollabThreadsValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const listThreads = context.container.resolve(ListThreadsUseCase);
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
                }
            },
            CollaborationMutation: {
                createCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await createCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const createThread = context.container.resolve(CreateThreadUseCase);
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
                },
                replyToCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await replyToCollabThreadValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const reply = context.container.resolve(ReplyToThreadUseCase);
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
                },
                resolveCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const resolveThread = context.container.resolve(ResolveThreadUseCase);
                        const threadResult = await resolveThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw threadResult.error;
                        }

                        return toGqlThread(threadResult.value);
                    });
                },
                reopenCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const reopenThread = context.container.resolve(ReopenThreadUseCase);
                        const threadResult = await reopenThread.execute(result.data.id);

                        if (threadResult.isFail()) {
                            throw threadResult.error;
                        }

                        return toGqlThread(threadResult.value);
                    });
                },
                updateCollabMessage: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await updateCollabMessageValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const updateMessage = context.container.resolve(UpdateMessageUseCase);
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
                },
                deleteCollabMessage: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await deleteCollabMessageValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const deleteMessage = context.container.resolve(DeleteMessageUseCase);
                        const deleteResult = await deleteMessage.execute({
                            threadId: result.data.threadId,
                            messageId: result.data.messageId
                        });

                        if (deleteResult.isFail()) {
                            throw deleteResult.error;
                        }

                        return true;
                    });
                },
                deleteCollabThread: async (_, args, context) => {
                    return resolve(async () => {
                        const result = await idOnlyValidation.safeParseAsync(args);
                        if (!result.success) {
                            throw createZodError(result.error);
                        }

                        const deleteThread = context.container.resolve(DeleteThreadUseCase);
                        const deleteResult = await deleteThread.execute(result.data.id);

                        if (deleteResult.isFail()) {
                            throw deleteResult.error;
                        }

                        return true;
                    });
                }
            }
        }
    });
};
