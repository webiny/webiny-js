import { createImplementation, Result } from "@webiny/feature/api";
import {
    createS3,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand
} from "@webiny/aws-sdk/client-s3/index.js";
import { BlobStore as BlobStoreAbstraction } from "~/domain/stage.js";
import { ExtractionStorageError, type ExtractionError } from "~/domain/errors.js";

/**
 * Large binary artifacts in the project's S3 bucket, under a `component-extraction/` prefix — the same
 * bucket the file manager uses, but not as file-manager files (this is transient working data, cleaned
 * up with the run). Callers pass a key relative to the prefix (conventionally `{runId}/...` so a run's
 * blobs delete together); `put` returns the full key to reference the blob by.
 */
const BLOB_KEY_PREFIX = "component-extraction";

const bucket = (): string => String(process.env.S3_BUCKET);

class S3BlobStoreImpl implements BlobStoreAbstraction.Interface {
    async put(
        key: string,
        bytes: Uint8Array,
        contentType: string
    ): Promise<Result<string, ExtractionError>> {
        const objectKey = `${BLOB_KEY_PREFIX}/${key}`;
        try {
            const s3 = createS3();
            await s3.send(
                new PutObjectCommand({
                    Bucket: bucket(),
                    Key: objectKey,
                    Body: bytes,
                    ContentType: contentType
                })
            );
            return Result.ok(objectKey);
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError(
                    "store a blob",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async get(ref: string): Promise<Result<Uint8Array, ExtractionError>> {
        try {
            const s3 = createS3();
            const response = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: ref }));
            if (!response.Body) {
                return Result.fail(
                    new ExtractionStorageError("read a blob", `${ref} returned no content`)
                );
            }
            return Result.ok(await response.Body.transformToByteArray());
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError(
                    "read a blob",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async deleteAll(runId: string): Promise<Result<void, ExtractionError>> {
        try {
            const s3 = createS3();
            const prefix = `${BLOB_KEY_PREFIX}/${runId}/`;
            const listed = await s3.send(
                new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix })
            );
            for (const object of listed.Contents ?? []) {
                if (object.Key) {
                    await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: object.Key }));
                }
            }
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError(
                    "clean up blobs",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }
}

export const S3BlobStore = createImplementation({
    abstraction: BlobStoreAbstraction,
    implementation: S3BlobStoreImpl,
    dependencies: []
});
