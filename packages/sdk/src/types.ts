export interface CmsSdkConfig {
    apiToken: string;
    apiHost: string;
    apiTenant: string;
    fetch?: typeof fetch;
}
