import { createImplementation, Result } from "@webiny/feature/api";
import { BrowserProvider, type ScreenshotRequest } from "~/domain/abstractions.js";
import {
    CRAWL_CACHE_MAX_AGE_DAYS,
    ExtractionArtifactCache,
    noopExtractionLog,
    ScreenshotStore,
    type CachedCrawl,
    type IExtractionLog,
    type StoredScreenshot
} from "~/features/shared/abstractions.js";
import {
    ExtractionBlockedByRobotsError,
    ExtractionInvalidUrlError,
    ExtractionNothingFoundError,
    ExtractionStorageError,
    type ExtractionError
} from "~/features/shared/errors.js";
import { CrawlSiteUseCase as UseCaseAbstraction } from "./abstractions.js";
import { fetchRobotsPolicy } from "~/http/fetchRobots.js";
import type { RobotsPolicy } from "~/browser/robots.js";
import { DEFAULT_CRAWL_LIMIT, normaliseUrl, selectCrawlUrls } from "~/crawl/urlScoring.js";
import { mergeObservations, toObservations, type Observations } from "~/crawl/toObservations.js";
import { buildModelPayload, PAYLOAD_CAPS } from "~/model/payload.js";
import { DEFAULT_TIMEOUTS } from "~/browser/launchConfig.js";
import type { CandidateLink } from "~/crawl/urlScoring.js";
import type { FontResource, PageSnapshot } from "~/domain/abstractions.js";

/**
 * Phase one: read the site — see the design brief, sections 10.2 to 10.4.
 *
 * Everything here is deterministic. Given the same site it produces the same inventory, which is what
 * makes a surprising theme traceable to the numbers rather than to the model, and what makes the result
 * worth caching at all.
 */

/** Desktop, because that is where sites carry the most design intent per page. */
const VIEWPORT = { width: 1440, height: 900 };
/** For the single mobile crop. */
const MOBILE_VIEWPORT = { width: 390, height: 844 };

/**
 * Below this, the page did not give us enough to work from.
 *
 * Set low deliberately: this catches a login wall or a page that renders nothing, not a sparse
 * homepage.
 */
export const MIN_CANDIDATE_ELEMENTS = 20;

const hostOf = (url: string): string => {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
};

class CrawlSiteUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private browserProvider: BrowserProvider.Interface,
        private screenshots: ScreenshotStore.Interface,
        private cache: ExtractionArtifactCache.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<CachedCrawl, ExtractionError>> {
        const log = params.log ?? noopExtractionLog;

        const entryUrl = normaliseUrl(params.entryUrl, params.entryUrl);
        if (!entryUrl) {
            return Result.fail(new ExtractionInvalidUrlError(params.entryUrl));
        }

        await log.info({
            message: `Starting crawl of ${entryUrl}`,
            data: {
                requestedUrl: params.entryUrl,
                normalisedUrl: entryUrl,
                crawlLimit: params.crawlLimit ?? DEFAULT_CRAWL_LIMIT,
                force: params.force === true
            }
        });

        const cached = await this.cache.get(entryUrl);
        const reusable = cached.isOk() && cached.value ? this.reusable(cached.value) : undefined;

        if (!params.force) {
            if (reusable) {
                await log.info({
                    message: "Reusing the cached crawl; the site was not read again",
                    data: {
                        crawledOn: reusable.crawledOn,
                        sampledUrls: reusable.payload.source.sampledUrls,
                        screenshots: reusable.screenshots.length
                    }
                });
                return Result.ok(reusable);
            }

            if (cached.isOk() && cached.value) {
                await log.info({
                    message: "Discarding the cached crawl: its screenshots may have expired",
                    data: {
                        crawledOn: cached.value.crawledOn,
                        maxAgeDays: CRAWL_CACHE_MAX_AGE_DAYS
                    }
                });
            }
        }

        if (cached.isOk() && cached.value) {
            // This crawl is about to replace that entry, which orphans the screenshots it owned. They
            // are removed here rather than at the end of a task, because it is the cache entry — not the
            // task — that keeps them alive.
            const replaced = await this.screenshots.deleteAll(cached.value.extractionId);
            if (replaced.isFail()) {
                await log.error({
                    message: "Could not remove the previous crawl's screenshots",
                    error: replaced.error,
                    data: { previousExtractionId: cached.value.extractionId }
                });
            }
        }

        const robots = await fetchRobotsPolicy({ url: entryUrl });
        await log.info({
            message: "Checked the site's crawl rules",
            data: {
                entryAllowed: robots.isAllowed(entryUrl),
                crawlDelayMs: robots.crawlDelayMs
            }
        });

        if (!robots.isAllowed(entryUrl)) {
            return Result.fail(new ExtractionBlockedByRobotsError(entryUrl));
        }

        const session = await this.browserProvider.open();

        // The layer's internal layout is the least-verified part of this feature, so which binary
        // actually ran is the first question a failed extraction raises.
        await log.info({ message: "Browser started", data: session.diagnostics });

        try {
            return await this.crawl({ ...params, entryUrl, log }, robots, session);
        } finally {
            // Always. A leaked browser in a Lambda is a leaked invocation, and the container may be
            // reused by the next task.
            await session.close();
        }
    }

    /**
     * A cached crawl is only reusable while the screenshots it points at still exist.
     *
     * The S3 lifecycle rule expires them, and the key-value store has no matching TTL, so age is checked
     * here instead. Without this, an old entry would quietly hand the model an inventory with no images.
     */
    private reusable(crawl: CachedCrawl): CachedCrawl | undefined {
        const ageMs = Date.now() - new Date(crawl.crawledOn).getTime();
        const maxAgeMs = CRAWL_CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

        // A malformed timestamp is treated as too old rather than trusted.
        if (!Number.isFinite(ageMs) || ageMs > maxAgeMs) {
            return undefined;
        }

        return crawl;
    }

    private async crawl(
        params: UseCaseAbstraction.Params & { entryUrl: string; log: IExtractionLog },
        robots: RobotsPolicy,
        session: BrowserProvider.Session
    ): Promise<Result<CachedCrawl, ExtractionError>> {
        const { extractionId, entryUrl, log } = params;
        const limit = params.crawlLimit ?? DEFAULT_CRAWL_LIMIT;
        const startedAt = Date.now();

        const stored: StoredScreenshot[] = [];
        const pages: Observations[] = [];
        const fonts = new Map<string, FontResource>();
        const sampledUrls: string[] = [];

        const report = async (pagesDone: number, pagesTotal: number, currentUrl?: string) => {
            await params.onProgress?.({ pagesDone, pagesTotal, currentUrl });
        };

        // The entry page first, on its own: its links decide what else is worth reading.
        await report(0, limit, entryUrl);

        const entry = await this.capture(session, entryUrl, extractionId, stored, [
            { label: `${hostOf(entryUrl)} — top of the page`, crop: "above-fold" },
            { label: `${hostOf(entryUrl)} — middle of the page`, crop: "mid-page" },
            { label: `${hostOf(entryUrl)} — bottom of the page`, crop: "footer" }
        ]);

        if (entry.isFail()) {
            await log.error({ message: `Could not read ${entryUrl}`, error: entry.error });
            return Result.fail(entry.error);
        }

        await this.logPage(log, entryUrl, entry.value);

        if (entry.value.candidateCount < MIN_CANDIDATE_ELEMENTS) {
            return Result.fail(
                new ExtractionNothingFoundError(entryUrl, entry.value.candidateCount)
            );
        }

        pages.push(toObservations(entry.value.elements));
        sampledUrls.push(entryUrl);
        for (const font of entry.value.fontResources) {
            fonts.set(font.url, font);
        }

        const links: CandidateLink[] = entry.value.links;
        const scored = selectCrawlUrls({ entryUrl, links, limit });
        // Re-checked against robots: selection works from the entry page's links, and a site can
        // perfectly well disallow a subtree that it still links to from its own navigation.
        const chosen = scored.filter(
            candidate => candidate.url !== entryUrl && robots.isAllowed(candidate.url)
        );

        // The scoring reasons are logged, not just the winners. "Why did it read the blog instead of
        // the pricing page?" is the most likely question about a disappointing theme, and it is
        // unanswerable after the fact without this.
        await log.info({
            message: `Chose ${chosen.length} more page(s) to read from ${links.length} link(s)`,
            data: {
                chosen: chosen.map(candidate => ({
                    url: candidate.url,
                    score: candidate.score,
                    reasons: candidate.reasons
                })),
                excludedByRobots: scored
                    .filter(candidate => !robots.isAllowed(candidate.url))
                    .map(candidate => candidate.url)
            }
        });

        await report(1, Math.min(limit, chosen.length + 1), undefined);

        // Sequentially. A 2 GB Lambda running Chromium has no headroom for concurrent page loads, and
        // it is also the polite way to read someone else's site.
        let done = 1;
        for (const candidate of chosen) {
            if (robots.crawlDelayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, robots.crawlDelayMs));
            }

            await report(done, chosen.length + 1, candidate.url);

            const page = await this.capture(session, candidate.url, extractionId, stored, [
                { label: `${candidate.url} — top of the page`, crop: "above-fold" }
            ]);

            // One unreadable interior page must not lose the crawl; the entry page is the one we
            // genuinely cannot do without.
            if (page.isOk()) {
                await this.logPage(log, candidate.url, page.value);
                pages.push(toObservations(page.value.elements));
                sampledUrls.push(candidate.url);
                for (const font of page.value.fontResources) {
                    fonts.set(font.url, font);
                }
            } else {
                await log.error({
                    message: `Skipped ${candidate.url}; the rest of the crawl continued`,
                    error: page.error
                });
            }

            done += 1;
        }

        // The dark-mode probe, on the entry page only. A second full crawl in dark mode would double
        // the cost to answer a question the homepage already answers.
        const darkColors = await this.probeDarkMode(session, entryUrl);

        const mobile = await this.captureMobile(session, entryUrl, extractionId);
        if (mobile) {
            stored.push(mobile);
        }

        const payload = buildModelPayload({
            entryUrl,
            sampledUrls,
            viewportWidth: VIEWPORT.width,
            observations: mergeObservations(pages),
            darkColors,
            fonts: [...fonts.values()]
        });

        const crawl: CachedCrawl = {
            payload,
            screenshots: stored.slice(0, PAYLOAD_CAPS.screenshots),
            extractionId,
            crawledOn: new Date().toISOString()
        };

        // The inventory the model will actually judge. Counts rather than values: enough to see that
        // the crawl found a real palette, without a log entry the size of the payload.
        await log.info({
            message: `Built the inventory from ${sampledUrls.length} page(s)`,
            data: {
                durationMs: Date.now() - startedAt,
                sampledUrls,
                colors: payload.colors.length,
                fontSizes: payload.fontSizes.length,
                fontFamilies: payload.fontFamilies.map(entry => entry.value),
                spacing: payload.spacing.length,
                radii: payload.radii.length,
                shadows: payload.shadows.length,
                webFonts: payload.fonts.length,
                screenshots: crawl.screenshots.length,
                topColors: payload.colors
                    .slice(0, 8)
                    .map(entry => `${entry.value} (${Math.round(entry.share * 100)}%)`),
                darkMode: payload.darkMode
            }
        });

        // Cached best-effort: a crawl we cannot cache is still a crawl we can build a theme from, so a
        // cache write failure must not lose the work it was meant to save.
        const cachedResult = await this.cache.set(entryUrl, crawl);
        if (cachedResult.isFail()) {
            await log.error({
                message: "Could not cache the crawl; a retry will have to read the site again",
                error: cachedResult.error
            });
        }

        await report(sampledUrls.length, sampledUrls.length, undefined);

        return Result.ok(crawl);
    }

    /**
     * One entry per page read, carrying the facts that explain a surprising result.
     *
     * `finalUrl` is here because a redirect is invisible otherwise, and "we extracted the wrong site"
     * usually starts with one. `dismissedOverlays` is here because hiding an overlay is the step most
     * likely to have removed something it should not have.
     */
    private async logPage(log: IExtractionLog, url: string, snapshot: PageSnapshot): Promise<void> {
        await log.info({
            message: `Read ${url}`,
            data: {
                status: snapshot.status,
                finalUrl: snapshot.finalUrl,
                redirected: snapshot.finalUrl !== url,
                title: snapshot.title,
                elementsSampled: snapshot.elements.length,
                candidatesFound: snapshot.candidateCount,
                cappedAtLimit: snapshot.candidateCount > snapshot.elements.length,
                linksFound: snapshot.links.length,
                webFonts: snapshot.fontResources.map(font => font.url),
                dismissedOverlays: snapshot.dismissedOverlays,
                screenshotsTaken: snapshot.screenshots.map(shot => shot.label),
                screenshotsFailed: snapshot.failedScreenshots
            }
        });
    }

    private async capture(
        session: BrowserProvider.Session,
        url: string,
        extractionId: string,
        stored: StoredScreenshot[],
        requests: ScreenshotRequest[]
    ): Promise<Result<PageSnapshot, ExtractionError>> {
        try {
            const snapshot = await session.capture({
                url,
                viewportWidth: VIEWPORT.width,
                viewportHeight: VIEWPORT.height,
                timeoutMs: DEFAULT_TIMEOUTS.pageTotalMs,
                screenshots: {
                    requests,
                    write: async (image, label) => {
                        const result = await this.screenshots.put(extractionId, label, image);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        stored.push(result.value);
                        return result.value.key;
                    }
                }
            });

            return Result.ok(snapshot);
        } catch (error) {
            // The browser layer's errors are already written for the user — a bot wall names the vendor
            // and what to do — so they are passed through rather than replaced with a generic message.
            return Result.fail(
                new ExtractionStorageError(
                    `read ${url}`,
                    error instanceof Error ? error.message : String(error)
                )
            );
        }
    }

    private async probeDarkMode(
        session: BrowserProvider.Session,
        entryUrl: string
    ): Promise<Observations["colors"] | undefined> {
        try {
            const snapshot = await session.capture({
                url: entryUrl,
                viewportWidth: VIEWPORT.width,
                viewportHeight: VIEWPORT.height,
                emulateDarkMode: true,
                timeoutMs: DEFAULT_TIMEOUTS.pageTotalMs
            });

            return toObservations(snapshot.elements).colors;
        } catch {
            // Not knowing whether the site has a dark variant is a degraded result, not a failure —
            // `assessDarkMode` reports it as unprobed and dark is derived from light.
            return undefined;
        }
    }

    /**
     * The single mobile crop, which is the cheapest way to learn whether the site's type and spacing
     * scale with the viewport or are fixed.
     */
    private async captureMobile(
        session: BrowserProvider.Session,
        entryUrl: string,
        extractionId: string
    ): Promise<StoredScreenshot | undefined> {
        const captured: StoredScreenshot[] = [];

        try {
            await session.capture({
                url: entryUrl,
                viewportWidth: MOBILE_VIEWPORT.width,
                viewportHeight: MOBILE_VIEWPORT.height,
                timeoutMs: DEFAULT_TIMEOUTS.pageTotalMs,
                screenshots: {
                    requests: [{ label: `${hostOf(entryUrl)} — on a phone`, crop: "above-fold" }],
                    write: async (image, label) => {
                        const result = await this.screenshots.put(extractionId, label, image);
                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }
                        captured.push(result.value);
                        return result.value.key;
                    }
                }
            });
        } catch {
            // A missing mobile crop degrades the model's input; it does not invalidate the crawl.
            return undefined;
        }

        return captured[0];
    }
}

export const CrawlSiteUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CrawlSiteUseCaseImpl,
    dependencies: [BrowserProvider, ScreenshotStore, ExtractionArtifactCache]
});
