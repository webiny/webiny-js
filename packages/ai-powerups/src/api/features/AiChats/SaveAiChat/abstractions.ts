import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ModelMessage } from "ai";
import type { AiChat } from "../domain/types.js";
import type { AiChatNotAuthenticatedError } from "../domain/errors.js";
import type { AiChatNotFoundError } from "../domain/errors.js";
import type { AiChatPersistenceError } from "../domain/errors.js";
import type { AiChatTooLargeError } from "../domain/errors.js";
import type { AiChatValidationError } from "../domain/errors.js";

export interface ISaveAiChatInput {
    /** Omit it to start a new chat. With it, the chat must exist and is overwritten. */
    id?: string;
    /** Defaults to the first question for a new chat, and to the saved title otherwise. */
    title?: string;
    /** The whole conversation so far, not only the newest turn. */
    messages: ModelMessage[];
}

/**
 * SaveAiChat Use Case - Creates or overwrites one of the current identity's chats. The client saves
 * after each turn, so a chat is never more than one turn behind the palette.
 */
export interface ISaveAiChatUseCase {
    execute(input: ISaveAiChatInput): Promise<Result<AiChat, UseCaseError>>;
}

export interface ISaveAiChatUseCaseErrors {
    notAuthenticated: AiChatNotAuthenticatedError;
    notFound: AiChatNotFoundError;
    validation: AiChatValidationError;
    tooLarge: AiChatTooLargeError;
    persistence: AiChatPersistenceError;
}

type UseCaseError = ISaveAiChatUseCaseErrors[keyof ISaveAiChatUseCaseErrors];

export const SaveAiChatUseCase = createAbstraction<ISaveAiChatUseCase>("SaveAiChatUseCase");

export namespace SaveAiChatUseCase {
    export type Interface = ISaveAiChatUseCase;
    export type Input = ISaveAiChatInput;
    export type Error = UseCaseError;
}
