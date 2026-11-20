import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AiChat } from "../domain/types.js";
import type { AiChatSummary } from "../domain/types.js";
import type { AiChatPersistenceError } from "../domain/errors.js";
import type { AiChatTooLargeError } from "../domain/errors.js";
import type { AiChatValidationError } from "../domain/errors.js";

export interface IAiChatsRepositoryListParams {
    limit: number;
    cursor?: string;
}

export interface IAiChatsRepositoryListResult {
    items: AiChatSummary[];
    cursor: string | null;
}

/**
 * AiChatsRepository - An owner's saved chats in the tenant's key-value store. Every method takes the
 * owner, so nothing here can reach another identity's chats.
 */
export interface IAiChatsRepository {
    /** Newest first. */
    list(
        ownerId: string,
        params: IAiChatsRepositoryListParams
    ): Promise<Result<IAiChatsRepositoryListResult, ListError>>;
    /** `null` when the owner has no chat with this id. */
    get(ownerId: string, chatId: string): Promise<Result<AiChat | null, AiChatPersistenceError>>;
    save(ownerId: string, chat: AiChat): Promise<Result<AiChat, SaveError>>;
    delete(ownerId: string, chatId: string): Promise<Result<void, AiChatPersistenceError>>;
}

type ListError = AiChatPersistenceError | AiChatValidationError;
type SaveError = AiChatPersistenceError | AiChatTooLargeError;

export const AiChatsRepository = createAbstraction<IAiChatsRepository>("AiChatsRepository");

export namespace AiChatsRepository {
    export type Interface = IAiChatsRepository;
    export type ListParams = IAiChatsRepositoryListParams;
    export type ListResult = IAiChatsRepositoryListResult;
    export type ListError = AiChatPersistenceError | AiChatValidationError;
    export type SaveError = AiChatPersistenceError | AiChatTooLargeError;
    export type Error = AiChatPersistenceError;
}
