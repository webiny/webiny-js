import { createAbstraction } from "@webiny/feature/admin";
import type {
    CollabMessage,
    CollabThread,
    CollabThreadsMeta,
    CollabUser,
    CreateThreadInput,
    ListThreadsWhere
} from "~/types.js";

export interface IListThreadsResult {
    items: CollabThread[];
    meta: CollabThreadsMeta;
}

export interface IListThreadsOptions {
    limit?: number;
    after?: string | null;
}

/**
 * Multi-method data-access surface for the collaboration GraphQL API. The Gateway talks to the
 * API; the Api use case is a thin, injectable pass-through the presenter depends on.
 */
export interface ICollaborationApi {
    listThreads(
        where: ListThreadsWhere,
        options?: IListThreadsOptions
    ): Promise<IListThreadsResult>;
    createThread(input: CreateThreadInput): Promise<CollabThread>;
    replyToThread(threadId: string, body: string, mentions?: string[]): Promise<CollabMessage>;
    resolveThread(id: string): Promise<CollabThread>;
    reopenThread(id: string): Promise<CollabThread>;
    deleteThread(id: string): Promise<boolean>;
    updateMessage(threadId: string, messageId: string, body: string): Promise<CollabMessage>;
    deleteMessage(threadId: string, messageId: string): Promise<boolean>;
    /** Tenant members that can be @mentioned. Best-effort: returns [] if unavailable. */
    listMentionableUsers(): Promise<CollabUser[]>;
}

export const CollaborationGateway = createAbstraction<ICollaborationApi>("Collaboration/Gateway");

export namespace CollaborationGateway {
    export type Interface = ICollaborationApi;
}

export const CollaborationApi = createAbstraction<ICollaborationApi>("Collaboration/Api");

export namespace CollaborationApi {
    export type Interface = ICollaborationApi;
    export type ListResult = IListThreadsResult;
    export type ListOptions = IListThreadsOptions;
}
