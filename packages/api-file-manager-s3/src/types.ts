import S3 from "aws-sdk/clients/s3";

export interface PresignedPostPayloadData {
    name: string;
    type: string;
    size: number;
    keyPrefix: string;
}

export interface PresignedPostPayloadDataResponse {
    data: S3.PresignedPost;
    file: {
        id: string;
        name: string;
        key: string;
        type: string;
        size: number;
    };
}
