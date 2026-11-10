import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";
import { getSignedUrl } from "@webiny/aws-sdk/client-s3/index.js";
import { UploadPartCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { getFileStorageKey } from "~/utils/getFileStorageKey.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";

class CreateMultiPartUploadUseCaseImpl implements CreateMultiPartUploadUseCase.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly s3: S3,
        private readonly bucket: string
    ) {}

    public async execute(
        params: CreateMultiPartUploadUseCase.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts, clientId } = params;

        const bucket = this.bucket;
        const s3Client = this.s3;
        const tenant = this.tenantContext.getTenant();
        await ensureNewFileId({ s3: s3Client, bucket, file, tenantId: tenant.id, clientId });

        const s3Params = { Bucket: bucket, Key: getFileStorageKey(tenant.id, file.key) };

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
        dependencies: [TenantContext, S3Client, S3Bucket]
    });
