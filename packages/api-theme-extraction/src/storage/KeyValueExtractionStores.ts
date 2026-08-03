import { createImplementation, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import {
    ExtractionArtifactCache as ExtractionArtifactCacheAbstraction,
    ExtractionLock as ExtractionLockAbstraction,
    type CachedCrawl
} from "~/features/shared/abstractions.js";
import { ExtractionStorageError, type ExtractionError } from "~/features/shared/errors.js";
import { normaliseUrl } from "~/crawl/urlScoring.js";

/**
 * The crawl cache and the concurrency lock, both on the tenant-scoped key-value store.
 *
 * Tenant scoping comes free from `KeyValueStore`, which matters for both: one tenant's crawl of a URL
 * must not be served to another, and one tenant's extraction must not block another's.
 */

export const CRAWL_CACHE_KEY_PREFIX = "theme:extraction:crawl:";
export const EXTRACTION_LOCK_KEY = "theme:extraction:lock";

/**
 * Cache key for a crawl.
 *
 * Normalised through the same function the crawler uses to compare URLs, so `northbeam.io` and
 * `northbeam.io/` are one cache entry rather than two crawls of the same site.
 */
export const crawlCacheKey = (entryUrl: string): string => {
    return `${CRAWL_CACHE_KEY_PREFIX}${normaliseUrl(entryUrl, entryUrl) ?? entryUrl}`;
};

class KeyValueArtifactCacheImpl implements ExtractionArtifactCacheAbstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async get(entryUrl: string): Promise<Result<CachedCrawl | null, ExtractionError>> {
        const result = await this.store.get<CachedCrawl>(crawlCacheKey(entryUrl));

        // A cache miss is not a failure. The store reports a missing key as an error, and treating that
        // as one here would turn every first-ever extraction into a failed one.
        if (result.isFail()) {
            return Result.ok(null);
        }

        return Result.ok(result.value ?? null);
    }

    async set(entryUrl: string, crawl: CachedCrawl): Promise<Result<void, ExtractionError>> {
        const result = await this.store.set(crawlCacheKey(entryUrl), crawl);

        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("cache the crawl results", result.error.message)
            );
        }

        return Result.ok(undefined);
    }
}

export const KeyValueArtifactCache = createImplementation({
    abstraction: ExtractionArtifactCacheAbstraction,
    implementation: KeyValueArtifactCacheImpl,
    dependencies: [KeyValueStore]
});

/**
 * One extraction at a time per tenant.
 *
 * This is a check-then-set, so it is NOT atomic: two requests arriving in the same instant can both
 * see an empty lock and both proceed. That is a deliberate trade rather than an oversight. What this
 * needs to stop is the realistic case — an impatient double-click, or two admins starting an
 * extraction minutes apart — and for that a check-then-set is sufficient and costs one read. Making it
 * genuinely atomic means a conditional write against DynamoDB, which the key-value abstraction does not
 * expose and which would mean reaching past it into storage. If concurrent extractions turn out to
 * cause real trouble, that is the fix, and the seam here does not change.
 */
class KeyValueExtractionLockImpl implements ExtractionLockAbstraction.Interface {
    constructor(private store: KeyValueStore.Interface) {}

    async current(): Promise<Result<string | null, ExtractionError>> {
        const result = await this.store.get<string>(EXTRACTION_LOCK_KEY);

        if (result.isFail()) {
            return Result.ok(null);
        }

        return Result.ok(result.value ?? null);
    }

    async acquire(extractionId: string): Promise<Result<boolean, ExtractionError>> {
        const held = await this.current();
        if (held.isFail()) {
            return Result.fail(held.error);
        }

        // Re-acquiring our own lock succeeds, so a task that resumes after a `continue` iteration is
        // not locked out by itself.
        if (held.value && held.value !== extractionId) {
            return Result.ok(false);
        }

        const result = await this.store.set(EXTRACTION_LOCK_KEY, extractionId);
        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("reserve the extraction slot", result.error.message)
            );
        }

        return Result.ok(true);
    }

    async release(extractionId: string): Promise<Result<void, ExtractionError>> {
        const held = await this.current();
        if (held.isFail()) {
            return Result.fail(held.error);
        }

        // Only the holder may release. Without this, a late-finishing abandoned task would release the
        // lock out from under the extraction that legitimately took it next.
        if (held.value && held.value !== extractionId) {
            return Result.ok(undefined);
        }

        const result = await this.store.delete(EXTRACTION_LOCK_KEY);
        if (result.isFail()) {
            return Result.fail(
                new ExtractionStorageError("release the extraction slot", result.error.message)
            );
        }

        return Result.ok(undefined);
    }
}

export const KeyValueExtractionLock = createImplementation({
    abstraction: ExtractionLockAbstraction,
    implementation: KeyValueExtractionLockImpl,
    dependencies: [KeyValueStore]
});
