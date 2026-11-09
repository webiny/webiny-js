import type { AiChatSaveFailure } from "./abstractions.js";

/** A save that failed, with why, so a caller can offer the fix without knowing the transport. */
export class AiChatSaveError extends Error {
    constructor(
        message: string,
        readonly failure: AiChatSaveFailure
    ) {
        super(message);
    }
}
