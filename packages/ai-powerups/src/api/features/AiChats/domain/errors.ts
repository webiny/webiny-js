import { BaseError } from "@webiny/feature/api";

export class AiChatNotAuthenticatedError extends BaseError {
    override readonly code = "AiChat/NotAuthenticated" as const;

    constructor() {
        super({
            message: "Only a signed-in identity has saved chats."
        });
    }
}

export class AiChatNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "AiChat/NotFound" as const;

    constructor(id: string) {
        super({
            message: `Chat "${id}" was not found.`,
            data: { id }
        });
    }
}

export class AiChatValidationError extends BaseError<{ message: string }> {
    override readonly code = "AiChat/Validation" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}

export class AiChatTooLargeError extends BaseError<{ bytes: number; maxBytes: number }> {
    override readonly code = "AiChat/TooLarge" as const;

    constructor(bytes: number, maxBytes: number) {
        super({
            message: `The chat is too long to save: ${bytes} bytes compressed, at most ${maxBytes}.`,
            data: { bytes, maxBytes }
        });
    }
}

export class AiChatPersistenceError extends BaseError {
    override readonly code = "AiChat/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
