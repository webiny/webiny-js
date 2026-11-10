import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AiChatNotAuthenticatedError } from "../domain/errors.js";
import type { AiChatNotFoundError } from "../domain/errors.js";
import type { AiChatPersistenceError } from "../domain/errors.js";

/** DeleteAiChat Use Case - Removes one of the current identity's chats and its messages. */
export interface IDeleteAiChatUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteAiChatUseCaseErrors {
    notAuthenticated: AiChatNotAuthenticatedError;
    notFound: AiChatNotFoundError;
    persistence: AiChatPersistenceError;
}

type UseCaseError = IDeleteAiChatUseCaseErrors[keyof IDeleteAiChatUseCaseErrors];

export const DeleteAiChatUseCase = createAbstraction<IDeleteAiChatUseCase>("DeleteAiChatUseCase");

export namespace DeleteAiChatUseCase {
    export type Interface = IDeleteAiChatUseCase;
    export type Error = UseCaseError;
}
