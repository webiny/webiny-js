import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AiChatSummary } from "../domain/types.js";
import type { AiChatNotAuthenticatedError } from "../domain/errors.js";
import type { AiChatPersistenceError } from "../domain/errors.js";
import type { AiChatValidationError } from "../domain/errors.js";

export interface IListAiChatsParams {
    /** Defaults to 50, at most 100. */
    limit?: number;
    /** The `cursor` of the previous page. */
    after?: string;
}

export interface IListAiChatsResult {
    items: AiChatSummary[];
    /** `null` on the last page. */
    cursor: string | null;
}

/** ListAiChats Use Case - The current identity's saved chats, newest first, one page at a time. */
export interface IListAiChatsUseCase {
    execute(params: IListAiChatsParams): Promise<Result<IListAiChatsResult, UseCaseError>>;
}

export interface IListAiChatsUseCaseErrors {
    notAuthenticated: AiChatNotAuthenticatedError;
    validation: AiChatValidationError;
    persistence: AiChatPersistenceError;
}

type UseCaseError = IListAiChatsUseCaseErrors[keyof IListAiChatsUseCaseErrors];

export const ListAiChatsUseCase = createAbstraction<IListAiChatsUseCase>("ListAiChatsUseCase");

export namespace ListAiChatsUseCase {
    export type Interface = IListAiChatsUseCase;
    export type Params = IListAiChatsParams;
    export type ListResult = IListAiChatsResult;
    export type Error = UseCaseError;
}
