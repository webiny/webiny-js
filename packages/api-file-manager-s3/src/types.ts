import type { PresignedPost } from "@webiny/aws-sdk/client-s3/index.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/index.js";
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type { PresignedPostPayloadData } from "@webiny/api-file-manager/features/upload/index.js";
export type { FileData } from "@webiny/api-file-manager/features/upload/index.js";

export interface PresignedPostPayloadDataResponse {
    data: PresignedPost;
    file: FileData;
}
