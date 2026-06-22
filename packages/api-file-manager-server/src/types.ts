import type { FileData } from "@webiny/api-file-manager/features/upload/index.js";
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type { PresignedPostPayloadData } from "@webiny/api-file-manager/features/upload/index.js";
export type { FileData } from "@webiny/api-file-manager/features/upload/index.js";

export interface LocalPresignedPostData {
    url: string;
    fields: {
        key: string;
        token: string;
    };
}

export interface PresignedPostPayloadDataResponse {
    data: LocalPresignedPostData;
    file: FileData;
}

export interface UploadTokenPayload {
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
}
