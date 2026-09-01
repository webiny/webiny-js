import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { getSignedUrl } from "@webiny/aws-sdk/client-s3/index.js";
import { UploadPartCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";

class CreateMultiPartUploadUseCaseImpl implements CreateMultiPartUploadUseCase.Interface {
    public async execute(
        params: CreateMultiPartUploadUseCase.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts } = params;

        const bucket = String(process.env.S3_BUCKET);
        const s3Client = new S3({ region: process.env.AWS_REGION });
        const s3Params = { Bucket: bucket, Key: file.key };

        const { UploadId } = await s3Client.createMultipartUpload(s3Params);

        const parts = await Promise.all(
            Array.from({ length: numberOfParts }).map((_, index) => {
                return getSignedUrl(
                    s3Client,
                    new UploadPartCommand({ ...s3Params, UploadId, PartNumber: index + 1 }),
                    { expiresIn: 86400 }
                ).then(url => ({
                    url,
                    partNumber: index + 1
                }));
            })
        );

        return {
            file,
            uploadId: UploadId as string,
            parts
        };
    }
}

export const CreateMultiPartUploadUseCaseImplementation =
    CreateMultiPartUploadUseCase.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: []
    });
