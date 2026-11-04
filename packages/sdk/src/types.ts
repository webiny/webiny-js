export type TokenProvider = string | (() => string | Promise<string>);

/**
 * Extra headers sent with every API request. A function is called before each request, so the
 * headers can differ per request (e.g. read from the incoming request on the server).
 */
export type HeadersConfig =
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);

export interface WebinyConfig {
    token?: TokenProvider;
    endpoint: string;
    tenant?: string;
    headers?: HeadersConfig;
    fetch?: typeof fetch;
}
