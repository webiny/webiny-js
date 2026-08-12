import { Result } from "@webiny/feature/api";
import {
    createS3,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand
} from "@webiny/aws-sdk/client-s3/index.js";
import type { IScreenshotStore, StoredScreenshot } from "~/abstractions.js";
import { CaptureStorageError } from "~/errors.js";

/**
 * Screenshots in the project's S3 bucket.
 *
 * The same bucket the file manager uses, under a caller-supplied prefix — not as file-manager *files*.
 * A generated crop of somebody's marketing site is working data for one capture, and putting it in the
 * media library would mean users tidying up after a feature they did not know produced files.
 *
 * The prefix is the one thing a consumer must choose (e.g. `"theme-extraction"`), so two features can
 * share the bucket without sharing a namespace, and each can delete its own working data without
 * touching the other's. Everything under a capture's prefix is meant to be deleted when it finishes.
 */

/** Filesystem- and S3-safe, and stable for the same label. */
const toObjectName = (label: string): string => {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${slug || "screenshot"}.png`;
};

const bucket = (): string => String(process.env.S3_BUCKET);

class S3ScreenshotStoreImpl implements IScreenshotStore {
    /** No trailing slash; keys are built as `${prefix}/${captureId}/${name}`. */
    constructor(private readonly prefix: string) {}

    private screenshotKey(captureId: string, label: string): string {
        return `${this.prefix}/${captureId}/${toObjectName(label)}`;
    }

    async put(
        captureId: string,
        label: string,
        image: Uint8Array
    ): Promise<Result<StoredScreenshot, CaptureStorageError>> {
        const key = this.screenshotKey(captureId, label);

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
                new CaptureStorageError(
                    "save a screenshot",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async get(key: string): Promise<Result<Uint8Array, CaptureStorageError>> {
        try {
            const s3 = createS3();
            const response = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));

            if (!response.Body) {
                return Result.fail(
                    new CaptureStorageError("read a screenshot", `${key} returned no content`)
                );
            }

            return Result.ok(await response.Body.transformToByteArray());
        } catch (error) {
            return Result.fail(
                new CaptureStorageError(
                    "read a screenshot",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    async deleteAll(captureId: string): Promise<Result<void, CaptureStorageError>> {
        try {
            const s3 = createS3();
            const prefix = `${this.prefix}/${captureId}/`;

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
                new CaptureStorageError(
                    "clean up screenshots",
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }
}

/**
 * Builds a screenshot store scoped to a prefix. Register it against your *own* feature's
 * `ScreenshotStore` abstraction as an instance — the prefix is configuration, not a container-resolvable
 * dependency, and the token is per-consumer so two features don't collide on one shared token:
 *
 * ```ts
 * // in your feature
 * export const ScreenshotStore = createAbstraction<IScreenshotStore>("MyFeature/ScreenshotStore");
 * // at registration
 * container.registerInstance(ScreenshotStore, createS3ScreenshotStore("my-feature"));
 * ```
 */
export const createS3ScreenshotStore = (prefix: string): IScreenshotStore => {
    return new S3ScreenshotStoreImpl(prefix);
};
