/**
 * The API answered, with an error. Thrown by the chats gateway so a caller can tell a request the
 * server refused, which carries the server's code (`AiChat/TooLarge`), from one that never got an
 * answer.
 */
export class AiChatsRequestError extends Error {
    constructor(
        message: string,
        readonly code: string
    ) {
        super(message);
    }
}
