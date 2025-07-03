export interface WbIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface WbLocation {
    folderId: string;
}

export interface WbError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
}
