export interface FileManagerSettings {
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
}

export interface UpdateSettingsInput {
    uploadMinFileSize?: number;
    uploadMaxFileSize?: number;
    srcPrefix?: string;
}
