import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type { PresignedPostPayloadData } from "@webiny/api-file-manager/features/upload/index.js";
export type { FileData } from "@webiny/api-file-manager/features/upload/index.js";

export interface UploadTokenPayload {
    /** The storage key the upload is written to. */
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    /** Set for one part of a multipart upload: which upload, and which part. */
    multipart?: {
        uploadId: string;
        partNumber: number;
    };
}
