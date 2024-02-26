import {
    S3,
    Part,
    ListPartsOutput,
    ListPartsCommand,
    CompleteMultipartUploadCommandOutput
} from "@webiny/aws-sdk/client-s3";

interface CompleteMultiPartUploadParams {
    fileKey: string;
    uploadId: string;
}

interface GetAllUploadPartsParams {
    Bucket: string;
    Key: string;
    UploadId: string;
}

export class CompleteMultiPartUploadUseCase {
    private readonly s3: S3;
    private readonly bucket: string;

    constructor(bucket: string, s3Client: S3) {
        this.bucket = bucket;
        this.s3 = s3Client;
    }

    async execute(params: CompleteMultiPartUploadParams) {
        const uploadParams = {
            Bucket: this.bucket,
            Key: params.fileKey,
            UploadId: params.uploadId
        };

        const allParts = await this.getAllUploadParts(uploadParams);

        const s3Params = {
            ...uploadParams,
            MultipartUpload: {
                Parts: allParts
            }
        };

        return new Promise<void>((resolve, reject) => {
            this.s3.completeMultipartUpload(
                s3Params,
                (err: any, data?: CompleteMultipartUploadCommandOutput) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }

                    console.log(data);
                    resolve();
                }
            );
        });
    }

    private async getAllUploadParts(params: GetAllUploadPartsParams) {
        const parts: Part[] = [];

        let marker: string | undefined = undefined;
        while (true) {
            const { Parts, PartNumberMarker }: ListPartsOutput = await this.s3.send(
                new ListPartsCommand({
                    ...params,
                    PartNumberMarker: marker
                })
            );

            if (Parts) {
                Parts.forEach(part => parts.push(part));
            }

            marker = PartNumberMarker || undefined;
            if (!marker) {
                break;
            }
        }

        return parts.map(part => ({
            ETag: part.ETag as string,
            PartNumber: part.PartNumber as number
        }));
    }
}
