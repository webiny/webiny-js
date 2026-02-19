export interface WebinyConfig {
    token?: string;
    endpoint: string;
    tenant: string;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
}
