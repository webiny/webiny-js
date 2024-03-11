import {
    S3,
    Part,
    ListPartsOutput,
    ListPartsCommand,
    CompleteMultipartUploadCommand
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
    private readonly emptyMarkerValues = [undefined, "0"];

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

        try {
            const command = new CompleteMultipartUploadCommand(s3Params);
            await this.s3.send(command);
        } catch (err) {
            console.error(err);
            throw err;
        }
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
            if (this.isMarkerEmpty(marker)) {
                break;
            }
        }

        return parts.map(part => ({
            ETag: part.ETag as string,
            PartNumber: part.PartNumber as number
        }));
    }

    private isMarkerEmpty(marker: string | undefined) {
        return this.emptyMarkerValues.includes(marker);
    }
}
