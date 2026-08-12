import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IAiConnectionInline } from "@webiny/api-core/features/ai/index.js";
import type { IScreenshotStore, StoredScreenshot } from "@webiny/site-capture";
import type { ModelPayload } from "~/model/payload.js";
import type { RoleSignals } from "~/crawl/roleSignals.js";
import type { ExtractionError } from "./errors.js";

/**
 * The seams between extraction and everything it needs from the platform.
 *
 * Kept in one place because they are all narrow, all storage-shaped, and all things a test wants to
 * replace at once. Each one is deliberately smaller than the platform feature behind it: extraction
 * needs to put a screenshot somewhere, not the file manager's whole surface.
 */

/**
 * Where extraction writes its debug trail.
 *
 * Shaped deliberately to match `controller.logger` from the background-task framework, so the task
 * hands its own logger straight to the use cases with no adapter in between. That matters more than the
 * small awkwardness of the params-object signature: the framework persists each entry to the task's log
 * record — immediately, so it survives a crash — and the Admin task viewer already renders them. A
 * bespoke logger would mean a debug trail that only exists in CloudWatch, where nobody correlates it
 * back to the extraction that produced it.
 *
 * `data` is the important half. Structured values are what make a log answerable ("which URLs did it
 * pick, and why?") rather than merely readable.
 */
export interface IExtractionLog {
    info(params: { message: string; data?: Record<string, unknown> }): Promise<void>;
    error(params: {
        message: string;
        error?: unknown;
        data?: Record<string, unknown>;
    }): Promise<void>;
}

/**
 * For callers with no task context — tests, and any future direct invocation.
 *
 * Silent rather than console-based on purpose: a use case run from a test should not print, and the one
 * caller that does have a logger always passes it.
 */
export const noopExtractionLog: IExtractionLog = {
    async info() {},
    async error() {}
};

/**
 * How long a cached crawl may be reused.
 *
 * Bounded by the screenshots, not by the freshness of the data: the S3 lifecycle rule on the
 * `theme-extraction/` prefix expires the images after this many days, so beyond it a cache entry would
 * point at objects that no longer exist and the model would silently be asked to judge a site it cannot
 * see. Kept in step with the rule in `CoreFileManager.ts` — if you change one, change the other.
 */
export const CRAWL_CACHE_MAX_AGE_DAYS = 7;

/**
 * Theme extraction's own screenshot-store token.
 *
 * The interface and the S3 implementation live in `@webiny/site-capture`; the DI token stays here
 * because it is per-consumer. Two capture features registering their own prefix against one shared
 * token in the same container would collide, and the last registered would silently win — so each owns
 * its token, bound to the shared `IScreenshotStore`, and registers a prefix-bound instance in
 * `feature.ts`.
 */
export const ScreenshotStore = createAbstraction<IScreenshotStore>(
    "ThemeExtraction/ScreenshotStore"
);

export namespace ScreenshotStore {
    export type Interface = IScreenshotStore;
}

/**
 * The phase-one artifact: everything the crawl learned, ready for the model.
 *
 * Cached because a crawl costs someone else's bandwidth and a good part of the task's budget. If the
 * model call fails, or the user retries with different guidance, re-reading the site would be both
 * wasteful and rude.
 */
export interface CachedCrawl {
    payload: ModelPayload;
    /**
     * Screenshots belonging to this crawl.
     *
     * The cache entry OWNS these objects. They outlive the task that produced them, because a retry
     * after a failed model call reuses this entry and needs the images — so nothing may delete them
     * while the entry still references them.
     */
    screenshots: StoredScreenshot[];
    /** Which extraction produced them, so a replacement can clean up the objects it orphans. */
    extractionId: string;
    /** ISO timestamp, so a caller can decide the crawl is too old to reuse. */
    crawledOn: string;
    /**
     * Deterministic per-role measurements (control/container radius, control border width). Consumed
     * after the model runs to snap those roles to the right ramp step. Optional so crawls cached
     * before this existed still analyse — they simply leave the roles at their defaults.
     */
    roleSignals?: RoleSignals;
}

export interface IExtractionArtifactCache {
    get(entryUrl: string): Promise<Result<CachedCrawl | null, ExtractionError>>;
    set(entryUrl: string, crawl: CachedCrawl): Promise<Result<void, ExtractionError>>;
}

export const ExtractionArtifactCache = createAbstraction<IExtractionArtifactCache>(
    "Theme/ExtractionArtifactCache"
);

export namespace ExtractionArtifactCache {
    export type Interface = IExtractionArtifactCache;
}

/**
 * One extraction at a time per tenant.
 *
 * Headless Chromium is the heaviest thing the API runs, and two concurrent crawls on a 2 GB function
 * is an out-of-memory kill that loses both. This is NOT a distributed mutex — see the
 * implementation's note on why that is the right trade here.
 */
export interface IExtractionLock {
    /** Returns false when another extraction already holds it. */
    acquire(extractionId: string): Promise<Result<boolean, ExtractionError>>;
    release(extractionId: string): Promise<Result<void, ExtractionError>>;
    /** The extraction currently holding the lock, if any. */
    current(): Promise<Result<string | null, ExtractionError>>;
}

export const ExtractionLock = createAbstraction<IExtractionLock>("Theme/ExtractionLock");

export namespace ExtractionLock {
    export type Interface = IExtractionLock;
}

/**
 * Which model to use, and over which connection.
 *
 * `connection` is either a name resolved by api-core's `AiConnectionFactory` registry, or an inline
 * `{ sdkName, apiKey }` — the two forms `Ai.generateText` accepts. The inline form is what lets a
 * project hand extraction the provider it has already configured elsewhere (typically AI Power-Ups
 * settings), decrypting the key inside its own `ExtractionSettings` implementation — so this package
 * still never stores a key of its own, and still never has to know where the credential came from.
 */
export interface IExtractionModelSettings {
    /** Must be `"<provider>/<model>"`; `Ai` rejects anything else. */
    model: string;
    connection?: string | IAiConnectionInline;
}

export interface IExtractionSettings {
    getModel(): Promise<Result<IExtractionModelSettings, ExtractionError>>;
}

export const ExtractionSettings = createAbstraction<IExtractionSettings>(
    "Theme/ExtractionSettings"
);

export namespace ExtractionSettings {
    export type Interface = IExtractionSettings;
    export type Model = IExtractionModelSettings;
}
