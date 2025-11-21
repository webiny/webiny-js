export interface FileManagerSettings {
    tenant: string;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
}

export interface UpdateSettingsInput {
    uploadMinFileSize?: number;
    uploadMaxFileSize?: number;
    srcPrefix?: string;
}
