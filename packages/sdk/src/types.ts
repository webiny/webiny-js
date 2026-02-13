export interface CmsSdkConfig {
    token: string;
    endpoint: string;
    tenant: string;
    fetch?: typeof fetch;
}
