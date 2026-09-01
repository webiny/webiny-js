import type { Part } from "@webiny/aws-sdk/client-s3/index.js";
import type { ListPartsOutput } from "@webiny/aws-sdk/client-s3/index.js";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { ListPartsCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CompleteMultipartUploadCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";

const EMPTY_MARKER_VALUES = [undefined, "0"];

class CompleteMultiPartUploadUseCaseImpl implements CompleteMultiPartUploadUseCase.Interface {
    public async execute(params: CompleteMultiPartUploadUseCase.Params): Promise<void> {
        const bucket = String(process.env.S3_BUCKET);
        const s3Client = new S3({ region: process.env.AWS_REGION });

        const uploadParams = {
            Bucket: bucket,
            Key: params.fileKey,
            UploadId: params.uploadId
        };

        const allParts = await getAllUploadParts(s3Client, uploadParams);

        const command = new CompleteMultipartUploadCommand({
            ...uploadParams,
            MultipartUpload: { Parts: allParts }
        });

        await s3Client.send(command);
    }
}

interface GetAllUploadPartsParams {
    Bucket: string;
    Key: string;
    UploadId: string;
}

async function getAllUploadParts(s3Client: S3, params: GetAllUploadPartsParams) {
    const parts: Part[] = [];

    let marker: string | undefined = undefined;
    while (true) {
        const { Parts, PartNumberMarker }: ListPartsOutput = await s3Client.send(
            new ListPartsCommand({
                ...params,
                PartNumberMarker: marker
            })
        );

        if (Parts) {
            Parts.forEach(part => parts.push(part));
        }

        marker = PartNumberMarker || undefined;
        if (EMPTY_MARKER_VALUES.includes(marker)) {
            break;
        }
    }

    return parts.map(part => ({
        ETag: part.ETag as string,
        PartNumber: part.PartNumber as number
    }));
}

export const CompleteMultiPartUploadUseCaseImplementation =
    CompleteMultiPartUploadUseCase.createImplementation({
        implementation: CompleteMultiPartUploadUseCaseImpl,
        dependencies: []
    });
