import { S3, getSignedUrl, UploadPartCommand } from "@webiny/aws-sdk/client-s3";
import { FileData } from "~/types";

interface CreateMultiPartUploadParams {
    file: FileData;
    numberOfParts: number;
}

export class CreateMultiPartUploadUseCase {
    private readonly s3: S3;
    private readonly bucket: string;

    constructor(bucket: string, s3Client: S3) {
        this.bucket = bucket;
        this.s3 = s3Client;
    }

    async execute({ file, numberOfParts }: CreateMultiPartUploadParams) {
        const s3Params = { Bucket: this.bucket, Key: file.key };

        const { UploadId } = await this.s3.createMultipartUpload(s3Params);

        const parts = await Promise.all(
            Array.from({ length: numberOfParts }).map((_, index) => {
                return getSignedUrl(
                    this.s3,
                    new UploadPartCommand({ ...s3Params, UploadId, PartNumber: index + 1 }),
                    {
                        // URL expires after 24 hours.
                        expiresIn: 86400
                    }
                ).then(url => ({
                    url,
                    partNumber: index + 1
                }));
            })
        );

        return {
            file,
            uploadId: UploadId,
            parts
        };
    }
}
