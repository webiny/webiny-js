import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AiChat } from "../domain/types.js";
import type { AiChatNotAuthenticatedError } from "../domain/errors.js";
import type { AiChatNotFoundError } from "../domain/errors.js";
import type { AiChatPersistenceError } from "../domain/errors.js";

/** GetAiChat Use Case - One of the current identity's chats, with its messages. */
export interface IGetAiChatUseCase {
    execute(id: string): Promise<Result<AiChat, UseCaseError>>;
}

export interface IGetAiChatUseCaseErrors {
    notAuthenticated: AiChatNotAuthenticatedError;
    notFound: AiChatNotFoundError;
    persistence: AiChatPersistenceError;
}

type UseCaseError = IGetAiChatUseCaseErrors[keyof IGetAiChatUseCaseErrors];

export const GetAiChatUseCase = createAbstraction<IGetAiChatUseCase>("GetAiChatUseCase");

export namespace GetAiChatUseCase {
    export type Interface = IGetAiChatUseCase;
    export type Error = UseCaseError;
}
