/**
 * Thrown while reading a request whose body is larger than the server accepts. The router handler
 * answers it with a 413.
 */
export class RequestBodyTooLargeError extends Error {
    public constructor(public readonly maxBytes: number) {
        super(`Request body exceeds the maximum allowed size of ${maxBytes} bytes.`);
        this.name = "RequestBodyTooLargeError";
    }
}
