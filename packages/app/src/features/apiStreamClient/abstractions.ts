import { createAbstraction } from "@webiny/feature/admin";

type IHeaders = Record<string, string | number | undefined>;

/**
 * The raw `fetch` response, handed to the caller unread so it owns the read loop. Aliased through
 * the abstraction so consumers name the contract rather than the DOM type it currently happens to
 * be — and so `ApiStreamClient.Response` reads as the counterpart to `ApiStreamClient.Request`.
 */
type IApiStreamResponse = globalThis.Response;

export interface IApiStreamRequest {
    /** Path relative to the API root, e.g. `/stream/fm/files/abc/enrich`. */
    path: string;
    /** Serialized as JSON when present. */
    body?: unknown;
    headers?: IHeaders;
    /**
     * Aborts the request AND the caller's read loop. Streaming responses stay open for as long as the
     * producer runs, so without this a caller that navigates away or closes its UI would leave the
     * connection open and keep consuming events into a component that no longer exists.
     */
    signal?: AbortSignal;
}

/**
 * Client for API endpoints that stream their response.
 *
 * Deliberately separate from `GraphQLClient`: that abstraction returns `Promise<TResult>` — a
 * buffered contract by type — and Webiny's GraphQL layer (graphql-js 16) has no incremental
 * delivery, so a streaming response can't travel through it. This returns the raw `Response` so the
 * caller owns the read loop and can hand `response.body` to any stream consumer.
 */
export interface IApiStreamClient {
    execute(params: IApiStreamRequest): Promise<IApiStreamResponse>;
}

export const ApiStreamClient = createAbstraction<IApiStreamClient>("ApiStreamClient");

export namespace ApiStreamClient {
    export type Headers = IHeaders;
    export type Interface = IApiStreamClient;
    export type Request = IApiStreamRequest;
    export type Response = IApiStreamResponse;
}

export class ApiStreamRequestError extends Error {
    constructor(
        message: string,
        readonly statusCode: number,
        readonly code?: string
    ) {
        super(message);
    }
}
