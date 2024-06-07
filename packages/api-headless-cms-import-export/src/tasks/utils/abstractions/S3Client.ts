import { S3 } from "@webiny/aws-sdk/client-s3";

export interface IS3Client {
    client: S3;

    destroy(): void;
}
