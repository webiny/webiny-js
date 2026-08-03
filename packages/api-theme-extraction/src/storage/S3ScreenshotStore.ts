import { createImplementation, Result } from "@webiny/feature/api";
import {
    createS3,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand
} from "@webiny/aws-sdk/client-s3/index.js";
import {
    ScreenshotStore as ScreenshotStoreAbstraction,
    type StoredScreenshot
} from "~/features/shared/abstractions.js";
import { ExtractionStorageError, type ExtractionError } from "~/features/shared/errors.js";

/**
 * Screenshots in the project's S3 bucket.
 *
 * The same bucket the file manager uses, under its own prefix — not as file-manager *files*. A
 * generated crop of somebody's marketing site is working data for one extraction, and putting it in
 * the media library would mean users tidying up after a feature they did not know produced files.
 *
 * Everything under the extraction's prefix is deleted when it finishes, so the bucket does not
 * accumulate a crop of every site anyone has ever pointed us at.
 */

export const SCREENSHOT_KEY_PREFIX = "theme-extraction";

/** Filesystem- and S3-safe, and stable for the same label. */
const toObjectName = (label: string): string => {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${slug || "screenshot"}.png`;
};

export const screenshotKey = (extractionId: string, label: string): string => {
    return `${SCREENSHOT_KEY_PREFIX}/${extractionId}/${toObjectName(label)}`;
};

const bucket = (): string => String(process.env.S3_BUCKET);

class S3ScreenshotStoreImpl implements ScreenshotStoreAbstraction.Interface {
    async put(
        extractionId: string,
        label: string,
        image: Uint8Array
    ): Promise<Result<StoredScreenshot, ExtractionError>> {
        const key = screenshotKey(extractionId, label);

        try {
            const s3 = createS3();
            await s3.send(
                new PutObjectCommand({
                    Bucket: bucket(),
                    Key: key,
                    Body: image,
                    ContentType: "image/png"
                })
            );

            return Result.ok({ key, label });
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError(
                    "save a screenshot",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async get(key: string): Promise<Result<Uint8Array, ExtractionError>> {
        try {
            const s3 = createS3();
            const response = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));

            if (!response.Body) {
                return Result.fail(
                    new ExtractionStorageError("read a screenshot", `${key} returned no content`)
                );
            }

            return Result.ok(await response.Body.transformToByteArray());
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError(
                    "read a screenshot",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async deleteAll(extractionId: string): Promise<Result<void, ExtractionError>> {
        try {
            const s3 = createS3();
            const prefix = `${SCREENSHOT_KEY_PREFIX}/${extractionId}/`;

            // Listed rather than derived from the recorded keys: cleanup has to remove what is actually
            // there, including crops from an attempt that failed before it reported them.
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
                    "clean up screenshots",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }
}

export const S3ScreenshotStore = createImplementation({
    abstraction: ScreenshotStoreAbstraction,
    implementation: S3ScreenshotStoreImpl,
    dependencies: []
});
