import { AiChatPersistenceError } from "./errors.js";

/**
 * Whether saving the same chat again could succeed. Only the store failing is worth another try.
 * Every other failure is about the chat itself, too large or too many messages for example, and
 * would fail the same way again.
 */
export const canRetrySave = (error: Error): boolean => {
    return error instanceof AiChatPersistenceError;
};
