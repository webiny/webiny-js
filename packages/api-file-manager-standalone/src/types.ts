import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type { PresignedPostPayloadData } from "@webiny/api-file-manager/features/upload/index.js";
export type { FileData } from "@webiny/api-file-manager/features/upload/index.js";

export interface UploadTokenPayload {
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
}
