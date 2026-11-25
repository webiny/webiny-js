import { Result } from "@webiny/feature/api";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";
import { getFileStorageKey } from "~/utils/getFileStorageKey.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetFileContentsByKeyUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsByKey/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";

class GetFileContentsByKeyUseCaseImpl implements GetFileContentsByKeyUseCase.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private s3: S3,
        private bucket: string
    ) {}

    async execute(key: string): Promise<Result<FileContents, GetFileContentsByKeyUseCase.Error>> {
        const tenant = this.tenantContext.getTenant();
        const bucketKey = getFileStorageKey(tenant.id, key);

        try {
            const response = await this.s3.getObject({ Bucket: this.bucket, Key: bucketKey });

            if (!response.Body) {
                return Result.fail(new FileNotFoundError(key));
            }

            const buffer = Buffer.from(await response.Body.transformToByteArray());
            const contentType = response.ContentType || "application/octet-stream";
            return Result.ok({ buffer, contentType });
        } catch (error) {
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }
}

export const GetFileContentsByKeyUseCaseImplementation =
    GetFileContentsByKeyUseCase.createImplementation({
        implementation: GetFileContentsByKeyUseCaseImpl,
        dependencies: [TenantContext, S3Client, S3Bucket]
    });
