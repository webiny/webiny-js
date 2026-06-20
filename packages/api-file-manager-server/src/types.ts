import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export interface PresignedPostPayloadData {
    name: string;
    type: string;
    size: number;
    id?: string;
    key?: string;
    keyPrefix?: string;
}

export interface FileData {
    id: string;
    key: string;
    name: string;
    size: number;
    type: string;
}

export interface PresignedPostPayloadDataResponse {
    data: LocalPresignedPostData;
    file: FileData;
}

export interface LocalPresignedPostData {
    url: string;
    fields: {
        key: string;
        token: string;
    };
}

export interface UploadTokenPayload {
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
}
