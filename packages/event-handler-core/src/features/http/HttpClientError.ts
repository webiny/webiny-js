/**
 * A request the client got wrong (malformed body, unsupported content type, ...). Transports answer
 * it with its own 4xx status and a `{ message, code, data }` body, instead of a 500.
 */
export class HttpClientError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly data: Record<string, unknown> | null;

    constructor(
        statusCode: number,
        code: string,
        message: string,
        data: Record<string, unknown> | null = null
    ) {
        super(message);
        this.name = "HttpClientError";
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
    }
}
