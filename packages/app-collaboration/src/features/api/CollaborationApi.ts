import { CollaborationApi as ApiAbstraction, CollaborationGateway } from "./abstractions.js";
import type { IListThreadsOptions } from "./abstractions.js";
import type { CreateThreadInput, ListThreadsWhere } from "~/types.js";

class CollaborationApiImpl implements ApiAbstraction.Interface {
    constructor(private gateway: CollaborationGateway.Interface) {}

    listThreads(where: ListThreadsWhere, options?: IListThreadsOptions) {
        return this.gateway.listThreads(where, options);
    }

    createThread(input: CreateThreadInput) {
        return this.gateway.createThread(input);
    }

    replyToThread(threadId: string, body: string, mentions?: string[]) {
        return this.gateway.replyToThread(threadId, body, mentions);
    }

    resolveThread(id: string) {
        return this.gateway.resolveThread(id);
    }

    reopenThread(id: string) {
        return this.gateway.reopenThread(id);
    }

    deleteThread(id: string) {
        return this.gateway.deleteThread(id);
    }

    updateMessage(threadId: string, messageId: string, body: string) {
        return this.gateway.updateMessage(threadId, messageId, body);
    }

    deleteMessage(threadId: string, messageId: string) {
        return this.gateway.deleteMessage(threadId, messageId);
    }

    listMentionableUsers() {
        return this.gateway.listMentionableUsers();
    }
}

export const CollaborationApi = ApiAbstraction.createImplementation({
    implementation: CollaborationApiImpl,
    dependencies: [CollaborationGateway]
});
