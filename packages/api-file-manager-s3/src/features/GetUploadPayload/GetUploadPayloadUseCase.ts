import type { PresignedPostOptions } from "@webiny/aws-sdk/client-s3/index.js";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";
import { createPresignedPost } from "@webiny/aws-sdk/client-s3/index.js";
import { validation } from "@webiny/validation";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js";
import { getFileStorageKey } from "~/utils/getFileStorageKey.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import type { UploadPayloadResponse } from "@webiny/api-file-manager/features/upload/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";

const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; /* 1TB */

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        return defaultValue;
    }
};

class GetUploadPayloadUseCaseImpl implements GetUploadPayloadUseCase.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly s3: S3,
        private readonly bucket: string
    ) {}

    public async execute(
        file: FileData,
        settings: FileManagerSettings,
        options?: GetUploadPayloadUseCase.Options
    ): Promise<UploadPayloadResponse> {
        const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
        const uploadMaxFileSize = sanitizeFileSizeValue(
            settings.uploadMaxFileSize,
            UPLOAD_MAX_FILE_SIZE_DEFAULT
        );

        const tenant = this.tenantContext.getTenant();
        await ensureNewFileId({
            s3: this.s3,
            bucket: this.bucket,
            file,
            tenantId: tenant.id,
            clientId: options?.clientId
        });

        const storageKey = getFileStorageKey(tenant.id, file.key);

        const params = {
            Key: storageKey,
            Expires: 60,
            Bucket: this.bucket,
            Conditions: [
                ["content-length-range", uploadMinFileSize, uploadMaxFileSize]
            ] as PresignedPostOptions["Conditions"],
            Fields: {
                "Content-Type": file.type
            }
        };

        const s3 = createS3Client();
        const payload = await createPresignedPost(s3, params);

        return {
            data: payload as unknown as Record<string, unknown>,
            file
        };
    }
}

export const GetUploadPayloadUseCaseImplementation = GetUploadPayloadUseCase.createImplementation({
    implementation: GetUploadPayloadUseCaseImpl,
    dependencies: [TenantContext, S3Client, S3Bucket]
});
