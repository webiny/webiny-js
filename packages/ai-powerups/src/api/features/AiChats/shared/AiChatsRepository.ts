import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { ModelMessage } from "ai";
import { AiChatsRepository as RepositoryAbstraction } from "./abstractions.js";
import { aiChatKeys } from "../domain/aiChatKeys.js";
import { AiChatPersistenceError } from "../domain/errors.js";
import { AiChatTooLargeError } from "../domain/errors.js";
import { AiChatValidationError } from "../domain/errors.js";
import type { AiChat } from "../domain/types.js";
import type { AiChatSummary } from "../domain/types.js";

/*
 * DynamoDB caps an item at 400 KB, keys and attribute names included. Tool results make a long chat
 * large, so the messages are stored gzipped, and a chat still over this after compression is refused
 * with an error the client can show, rather than failing somewhere in the store.
 */
const MAX_COMPRESSED_MESSAGES_BYTES = 350_000;

interface StoredMessages {
    compression: string;
    value: string;
}

class AiChatsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private compression: CompressionHandler.Interface
    ) {}

    async list(
        ownerId: string,
        params: RepositoryAbstraction.ListParams
    ): Promise<Result<RepositoryAbstraction.ListResult, RepositoryAbstraction.ListError>> {
        const collection = aiChatKeys.collection(ownerId);

        // Chat ids start with their creation time, so descending key order is newest first.
        const result = await this.keyValueStore.list<AiChatSummary>({
            collection,
            limit: params.limit,
            cursor: params.cursor,
            reverse: true
        });

        if (result.isFail()) {
            if (result.error.code === "KeyValueStore/InvalidCursor") {
                return Result.fail(new AiChatValidationError("The list cursor is not valid."));
            }
            return Result.fail(new AiChatPersistenceError(result.error));
        }

        const items = result.value.items.map(item => item.value);
        return Result.ok({ items, cursor: result.value.cursor });
    }

    async get(
        ownerId: string,
        chatId: string
    ): Promise<Result<AiChat | null, RepositoryAbstraction.Error>> {
        const summaryKey = aiChatKeys.summary(ownerId, chatId);
        const summary = await this.keyValueStore.get<AiChatSummary>(summaryKey);
        if (summary.isFail()) {
            if (summary.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok(null);
            }
            return Result.fail(new AiChatPersistenceError(summary.error));
        }

        const messagesKey = aiChatKeys.messages(ownerId, chatId);
        const stored = await this.keyValueStore.get<StoredMessages>(messagesKey);
        if (stored.isFail()) {
            // A summary without messages is a save that failed half way; treat it as not saved.
            if (stored.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok(null);
            }
            return Result.fail(new AiChatPersistenceError(stored.error));
        }

        try {
            const messages = await this.compression.decompress<ModelMessage[]>(stored.value);
            return Result.ok({ ...summary.value, messages });
        } catch (error) {
            return Result.fail(new AiChatPersistenceError(error as Error));
        }
    }

    async save(
        ownerId: string,
        chat: AiChat
    ): Promise<Result<AiChat, RepositoryAbstraction.SaveError>> {
        const { messages, ...summary } = chat;

        let stored: StoredMessages;
        try {
            stored = await this.compression.compress(messages);
        } catch (error) {
            return Result.fail(new AiChatPersistenceError(error as Error));
        }

        const bytes = Buffer.byteLength(stored.value, "utf8");
        if (bytes > MAX_COMPRESSED_MESSAGES_BYTES) {
            return Result.fail(new AiChatTooLargeError(bytes, MAX_COMPRESSED_MESSAGES_BYTES));
        }

        /*
         * Messages first, then the summary: the summary is what makes a chat appear in the list, so
         * a failure between the two leaves nothing listed rather than a chat that cannot be opened.
         */
        const messagesKey = aiChatKeys.messages(ownerId, chat.id);
        const messagesResult = await this.keyValueStore.set(messagesKey, stored);
        if (messagesResult.isFail()) {
            return Result.fail(new AiChatPersistenceError(messagesResult.error));
        }

        const summaryKey = aiChatKeys.summary(ownerId, chat.id);
        const collection = aiChatKeys.collection(ownerId);
        const summaryResult = await this.keyValueStore.set(summaryKey, summary, { collection });
        if (summaryResult.isFail()) {
            return Result.fail(new AiChatPersistenceError(summaryResult.error));
        }

        return Result.ok(chat);
    }

    async delete(
        ownerId: string,
        chatId: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        // The summary first, so the chat leaves the list even if removing its messages fails.
        const summaryKey = aiChatKeys.summary(ownerId, chatId);
        const summaryResult = await this.keyValueStore.delete(summaryKey);
        if (summaryResult.isFail()) {
            return Result.fail(new AiChatPersistenceError(summaryResult.error));
        }

        const messagesKey = aiChatKeys.messages(ownerId, chatId);
        const messagesResult = await this.keyValueStore.delete(messagesKey);
        if (messagesResult.isFail()) {
            return Result.fail(new AiChatPersistenceError(messagesResult.error));
        }

        return Result.ok();
    }
}

export const AiChatsRepository = RepositoryAbstraction.createImplementation({
    implementation: AiChatsRepositoryImpl,
    dependencies: [KeyValueStore, CompressionHandler]
});
