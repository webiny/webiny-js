import { BaseError } from "@webiny/feature/api";

export class CollabThreadNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "Collaboration/Thread/NotFound" as const;

    constructor(data: { id: string }) {
        super({
            message: `Collaboration thread with id "${data.id}" was not found!`,
            data
        });
    }
}

export class CollabMessageNotFoundError extends BaseError<{ threadId: string; messageId: string }> {
    override readonly code = "Collaboration/Message/NotFound" as const;

    constructor(data: { threadId: string; messageId: string }) {
        super({
            message: `Message "${data.messageId}" was not found in thread "${data.threadId}"!`,
            data
        });
    }
}

export class CollabThreadNotAuthorizedError extends BaseError {
    override readonly code = "Collaboration/Thread/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized to access this collaboration thread."
        });
    }
}

export class CollabThreadPersistenceError extends BaseError {
    override readonly code = "Collaboration/Thread/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class CollabThreadValidationError extends BaseError {
    override readonly code = "Collaboration/Thread/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

/**
 * The anchor (content + locator) could not be resolved — either no resolver is registered
 * for the content type, or the resolver reported the anchor does not exist.
 */
export class CollabAnchorNotFoundError extends BaseError<{ contentType: string; locator: string }> {
    override readonly code = "Collaboration/Anchor/NotFound" as const;

    constructor(data: { contentType: string; locator: string }) {
        super({
            message: `Could not resolve anchor "${data.locator}" for content type "${data.contentType}".`,
            data
        });
    }
}
