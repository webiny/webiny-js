import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileContentsStorage } from "@webiny/api-file-manager/features/file/FileContentsStorage/index.js";
import {
    FileAlreadyExistsError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";

/**
 * S3 refuses a conditional write (`IfNoneMatch: "*"`) with 412 when the key already exists, and
 * with 409 when another conditional write to the same key is still in progress.
 */
const isKeyTakenError = (error: unknown): boolean => {
    const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    return (
        s3Error?.$metadata?.httpStatusCode === 412 ||
        s3Error?.name === "PreconditionFailed" ||
        s3Error?.name === "ConditionalRequestConflict"
    );
};

const toPersistenceError = (error: unknown) => {
    return new FilePersistenceError(error instanceof Error ? error : new Error(String(error)));
};

class S3FileContentsStorageImpl implements FileContentsStorage.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private s3: S3,
        private bucket: string
    ) {}

    async put(
        input: FileContentsStorage.PutInput
    ): Promise<Result<void, FileContentsStorage.PutError>> {
        try {
            await this.s3.putObject({
                Bucket: this.bucket,
                Key: this.toObjectKey(input.key),
                Body: input.contents,
                ContentType: input.contentType,
                ContentLength: input.contents.byteLength,
                IfNoneMatch: "*"
            });
            return Result.ok();
        } catch (error) {
            if (isKeyTakenError(error)) {
                return Result.fail(new FileAlreadyExistsError({ key: input.key }));
            }
            return Result.fail(toPersistenceError(error));
        }
    }

    async delete(key: string): Promise<Result<void, FileContentsStorage.DeleteError>> {
        try {
            await this.s3.deleteObject({
                Bucket: this.bucket,
                Key: this.toObjectKey(key)
            });
            return Result.ok();
        } catch (error) {
            return Result.fail(toPersistenceError(error));
        }
    }

    private toObjectKey(key: string): string {
        return `tenants/${this.tenantContext.getTenant().id}/files/${key}`;
    }
}

export const S3FileContentsStorage = FileContentsStorage.createImplementation({
    implementation: S3FileContentsStorageImpl,
    dependencies: [TenantContext, S3Client, S3Bucket]
});
