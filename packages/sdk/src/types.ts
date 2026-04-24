export type TokenProvider = string | (() => string | Promise<string>);

export interface WebinyConfig {
    token?: TokenProvider;
    endpoint: string;
    tenant?: string;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
}
