export interface WebinyConfig {
    token: string;
    endpoint: string;
    tenant: string;
    fetch?: typeof fetch;
}
