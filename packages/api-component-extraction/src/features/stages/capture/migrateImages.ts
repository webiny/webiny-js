import { randomUUID } from "node:crypto";
import type { CapturedImage } from "@webiny/site-capture";
import { assetKey, assetUrlKey, type AssetOutcome, type MigratedAsset } from "~/domain/assets.js";

/**
 * Moves the images a page loaded into File Manager, and says what happened to each one.
 *
 * Every image the page rendered as content is migrated, whatever host serves it. A host-based rule
 * would migrate nothing on these sites: the imagery lives on the previous marketing vendor's
 * Cloudinary account, which is precisely the relationship the customer is leaving. What is left alone
 * is content belonging to an embed the migration does not reproduce, judged by which frame requested
 * it rather than by hostname.
 *
 * Nothing is ever silently left as a hotlink. An image that cannot be migrated comes back as
 * `unmigrated` with a reason, so a site that looks complete and breaks later is impossible to produce
 * without it appearing in the report.
 */

/** Just enough of the store to be swapped in a test. */
export interface AssetKeyValueStore {
    get<T>(key: string): Promise<{ value: T | null }>;
    set(key: string, value: unknown): Promise<void>;
}

export interface MigrateImagesDeps {
    store: AssetKeyValueStore;
    /** Upload bytes and create the File Manager records. Returns each created file's id and key. */
    uploadBatch(
        files: Array<{
            id: string;
            key: string;
            bytes: Uint8Array;
            contentType: string;
            name: string;
        }>
    ): Promise<Array<{ id: string; key: string }>>;
    /** Whether a File Manager file still exists. The map is a pointer, not a promise. */
    fileExists(fileId: string): Promise<boolean>;
    /** A renderable URL for a stored file. */
    urlOf(fileKey: string): string;
    log(message: string): Promise<void>;
}

/** A filename that says what the thing is, without trusting a URL's path to be sane. */
const filenameFor = (image: CapturedImage): string => {
    const extension = image.contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
    const stem =
        decodeURIComponent(image.url.split("?")[0].split("/").pop() ?? "")
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "image";
    return `${stem}.${extension}`;
};

export const migrateImages = async (
    deps: MigrateImagesDeps,
    images: CapturedImage[]
): Promise<AssetOutcome[]> => {
    const outcomes: AssetOutcome[] = [];
    const pendingUploads: Array<{
        image: CapturedImage;
        id: string;
        key: string;
    }> = [];

    /*
     * Within one run, deduplication has to happen at QUEUE time, not after the upload.
     *
     * A logo on eight pages arrives eight times before anything is uploaded, so checking only the
     * store — which nothing has written yet — queues eight uploads of one image. These two track what
     * this run has already decided: the hash that is queued, and the later references waiting on it.
     */
    const queuedByHash = new Map<string, { id: string; key: string }>();
    const repeats: Array<{ image: CapturedImage }> = [];
    const thisRun = new Map<string, MigratedAsset>();

    for (const image of images) {
        if (image.embedded) {
            outcomes.push({
                kind: "external",
                sourceUrl: image.url,
                reason: "loaded by an embedded frame, which the migration does not reproduce"
            });
            continue;
        }

        const reuse = async (asset: MigratedAsset, by: "url" | "content"): Promise<boolean> => {
            /*
             * The map is a pointer and a pointer can dangle: a hash match means identical bytes, not
             * that the file survived. Checked every time rather than trusted, because a map that can
             * silently point at a deleted file is the exact failure shape this project keeps hitting.
             */
            if (!(await deps.fileExists(asset.fileId))) {
                await deps.log(
                    `Asset ${asset.fileId} is in the map but no longer in File Manager; re-uploading ${image.url}`
                );
                return false;
            }
            outcomes.push({
                kind: "deduplicated",
                sourceUrl: image.url,
                fileId: asset.fileId,
                url: deps.urlOf(asset.fileKey),
                sha256: image.sha256,
                by
            });
            return true;
        };

        try {
            // 1. Same URL, already mapped. Cheapest, and it is only a pointer to the hash entry.
            const urlPointer = await deps.store.get<{ sha256: string }>(assetUrlKey(image.url));
            const knownHash = urlPointer.value?.sha256;
            if (knownHash) {
                const cached = thisRun.get(knownHash);
                const stored = cached
                    ? { value: cached }
                    : await deps.store.get<MigratedAsset>(assetKey(knownHash));
                if (stored.value && (await reuse(stored.value, "url"))) {
                    continue;
                }
            }

            // 2. Same bytes. The authority — one image served at several transformation URLs, or the
            //    same image seen again in a later run.
            const cached = thisRun.get(image.sha256);
            const byContent = cached
                ? { value: cached }
                : await deps.store.get<MigratedAsset>(assetKey(image.sha256));
            if (byContent.value && (await reuse(byContent.value, "content"))) {
                // The URL pointer is written even on a content hit, so the next run skips the download.
                await deps.store.set(assetUrlKey(image.url), { sha256: image.sha256 });
                continue;
            }

            // 3. Already queued by an earlier page in this same run — one upload, many references.
            if (queuedByHash.has(image.sha256)) {
                repeats.push({ image });
                continue;
            }

            // 4. New bytes. Keyed `${id}/${filename}` with the id passed explicitly, because File
            //    Manager derives a file's id from the first segment of its key when none is given —
            //    the shape that gave every reference image the id "component-extraction".
            const id = randomUUID();
            const key = `${id}/${filenameFor(image)}`;
            queuedByHash.set(image.sha256, { id, key });
            pendingUploads.push({ image, id, key });
        } catch (error) {
            outcomes.push({
                kind: "unmigrated",
                sourceUrl: image.url,
                reason: `could not be checked against the asset map: ${(error as Error).message}`
            });
        }
    }

    if (pendingUploads.length === 0) {
        return outcomes;
    }

    /** Resolve the references that were waiting on a queued upload, once it has an id. */
    const settleRepeats = (resolved: Map<string, MigratedAsset>): void => {
        for (const repeat of repeats) {
            const asset = resolved.get(repeat.image.sha256);
            if (!asset) {
                outcomes.push({
                    kind: "unmigrated",
                    sourceUrl: repeat.image.url,
                    reason: "the image it shares bytes with was not uploaded"
                });
                continue;
            }
            outcomes.push({
                kind: "deduplicated",
                sourceUrl: repeat.image.url,
                fileId: asset.fileId,
                url: deps.urlOf(asset.fileKey),
                sha256: repeat.image.sha256,
                by: "content"
            });
        }
    };

    try {
        const created = await deps.uploadBatch(
            pendingUploads.map(pending => ({
                id: pending.id,
                key: pending.key,
                bytes: pending.image.bytes,
                contentType: pending.image.contentType,
                name: filenameFor(pending.image)
            }))
        );
        const createdById = new Map(created.map(file => [file.id, file]));

        for (const pending of pendingUploads) {
            const file = createdById.get(pending.id);
            if (!file) {
                outcomes.push({
                    kind: "unmigrated",
                    sourceUrl: pending.image.url,
                    reason: "the upload batch returned no file for this image"
                });
                continue;
            }

            const asset: MigratedAsset = {
                fileId: file.id,
                fileKey: file.key,
                contentType: pending.image.contentType,
                size: pending.image.size,
                sourceUrl: pending.image.url,
                migratedOn: new Date().toISOString()
            };
            thisRun.set(pending.image.sha256, asset);
            await deps.store.set(assetKey(pending.image.sha256), asset);
            await deps.store.set(assetUrlKey(pending.image.url), { sha256: pending.image.sha256 });

            outcomes.push({
                kind: "migrated",
                sourceUrl: pending.image.url,
                fileId: file.id,
                url: deps.urlOf(file.key),
                sha256: pending.image.sha256,
                bytes: pending.image.size
            });
        }

        settleRepeats(thisRun);
    } catch (error) {
        // The whole batch failed. Every image in it is reported, never left to look migrated — the
        // references waiting on those uploads included.
        for (const pending of pendingUploads) {
            outcomes.push({
                kind: "unmigrated",
                sourceUrl: pending.image.url,
                reason: `upload failed: ${(error as Error).message}`
            });
        }
        for (const repeat of repeats) {
            outcomes.push({
                kind: "unmigrated",
                sourceUrl: repeat.image.url,
                reason: `upload failed: ${(error as Error).message}`
            });
        }
    }

    return outcomes;
};
