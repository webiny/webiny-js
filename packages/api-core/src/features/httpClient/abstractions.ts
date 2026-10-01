import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { HttpRequestError } from "./HttpRequestError.js";
import type { HttpStatusError } from "./HttpStatusError.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface IHttpClientRequest {
    url: string;
    method?: HttpMethod; // defaults to "GET"
    headers?: Record<string, string>;
    body?: unknown; // sent as JSON
    timeoutMs?: number; // defaults to 10 seconds
}

export interface IHttpClientErrors {
    request: HttpRequestError;
    status: HttpStatusError;
}

type HttpClientError = IHttpClientErrors[keyof IHttpClientErrors];

export interface IHttpClient {
    /**
     * Sends a request and parses the response body as JSON. The body is `unknown` on purpose:
     * validate it before use.
     */
    requestJson(request: IHttpClientRequest): Promise<Result<unknown, HttpClientError>>;
}

/** Outbound HTTP requests with a timeout, a status check and JSON parsing. */
export const HttpClient = createAbstraction<IHttpClient>("HttpClient");

export namespace HttpClient {
    export type Interface = IHttpClient;
    export type Request = IHttpClientRequest;
    export type Method = HttpMethod;
    export type Error = HttpClientError;
}
