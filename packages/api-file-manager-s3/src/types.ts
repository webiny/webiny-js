import S3 from "aws-sdk/clients/s3";

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
    data: S3.PresignedPost;
    file: FileData;
}
