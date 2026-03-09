import type { PresignedPost } from "@webiny/aws-sdk/client-s3/index.js";
import "@webiny/tasks/features/TaskController/augmentation.js"

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
    data: PresignedPost;
    file: FileData;
}
