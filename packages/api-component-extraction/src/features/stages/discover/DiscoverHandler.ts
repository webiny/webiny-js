import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    DiscoveredUrl,
    DiscoverArtifact,
    DiscoverySummary,
    UrlResolution,
    UrlSource
} from "~/domain/artifacts.js";
import { foldHost, isSameSite, pageIdentity } from "~/domain/pageIdentity.js";
import { collectSitemapLocs } from "./collectSitemapLocs.js";
import { crawlSite } from "./crawlSite.js";
import { sampleAcrossGroups, pathGroup } from "./grouping.js";
import { resolveUrls } from "./resolveUrls.js";
import { validateSitemapLocs } from "./validateSitemapLocs.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

/** One discovered page, before it is judged includable or sampled. */
interface Candidate {
    url: string;
    fromSitemap: boolean;
    fromCrawl: boolean;
    resolution: UrlResolution;
    title: string | null;
}

const provenance = (candidate: Candidate): UrlSource => {
    if (candidate.fromSitemap && candidate.fromCrawl) {
        return "both";
    }
    return candidate.fromSitemap ? "sitemap" : "crawl";
};

const toDiscovered = (candidate: Candidate, group: string): DiscoveredUrl => ({
    url: candidate.url,
    group,
    title: candidate.title,
    source: provenance(candidate),
    resolution: candidate.resolution
});

/**
 * A redirect is only worth recording when it actually moved the request somewhere else — and when it
 * moved it onto another site, the 200 that comes back is not evidence that this site has the page.
 * The crawl refuses such a URL outright; here, where a sitemap entry can name one, it is recorded with
 * the reason so the gate can say why rather than showing a healthy status on an excluded row.
 */
const resolutionOf = (params: {
    url: string;
    status: number | null;
    ok: boolean;
    finalUrl: string | null;
    siteHost: string;
}): UrlResolution => {
    const { url, status, finalUrl, siteHost } = params;
    const offSite = finalUrl !== null && !isSameSite(finalUrl, siteHost);
    const ok = params.ok && !offSite;
    const moved = finalUrl && finalUrl !== url;

    if (moved && offSite) {
        return { status, ok, finalUrl, offSite: true };
    }
    if (moved) {
        return { status, ok, finalUrl };
    }
    return { status, ok };
};

const sitemapStatus = (params: {
    kind: "absent" | "not-sitemap" | "urlset" | "index";
    entries: { identity: string }[];
    entryIdentity: string;
}): DiscoverySummary["sitemapStatus"] => {
    const { kind, entries, entryIdentity } = params;
    if (kind === "absent") {
        return "absent";
    }
    if (kind === "not-sitemap") {
        return "not-sitemap";
    }
    if (entries.length === 0) {
        return "empty";
    }
    if (entries.length === 1 && entries[0].identity === entryIdentity) {
        return "root-only";
    }
    return "used";
};

/**
 * Merge the two sources into one candidate per page, remembering which of them produced it. A page
 * both sources agree on is the healthy case; the interesting rows are the ones only one found.
 */
const unionSources = (params: {
    crawl: Awaited<ReturnType<typeof crawlSite>>;
    validated: ReturnType<typeof validateSitemapLocs>;
    siteHost: string;
}): Map<string, Candidate> => {
    const candidates = new Map<string, Candidate>();

    for (const [identity, page] of params.crawl.fetched) {
        const resolution = resolutionOf({
            url: page.url,
            status: page.status,
            ok: page.ok,
            finalUrl: page.finalUrl,
            siteHost: params.siteHost
        });
        candidates.set(identity, {
            url: page.url,
            fromSitemap: false,
            fromCrawl: true,
            resolution,
            title: page.title
        });
    }

    for (const [identity, url] of params.crawl.seen) {
        if (candidates.has(identity)) {
            continue;
        }
        candidates.set(identity, {
            url,
            fromSitemap: false,
            fromCrawl: true,
            resolution: { status: null, ok: false },
            title: null
        });
    }

    for (const entry of params.validated.entries) {
        const existing = candidates.get(entry.identity);
        if (existing) {
            existing.fromSitemap = true;
            continue;
        }
        candidates.set(entry.identity, {
            url: entry.url,
            fromSitemap: true,
            fromCrawl: false,
            resolution: { status: null, ok: false },
            title: null
        });
    }

    return candidates;
};

const resolvePending = async (params: {
    context: StageContext;
    pending: [string, Candidate][];
    siteHost: string;
}): Promise<void> => {
    const { context, pending } = params;
    await context.progress({
        message: `Resolving ${pending.length} URL(s) the crawl did not reach…`,
        total: pending.length
    });

    const pendingUrls = pending.map(([, candidate]) => candidate.url);
    const resolved = await resolveUrls(pendingUrls);

    for (const [, candidate] of pending) {
        const outcome = resolved.get(candidate.url);
        if (!outcome) {
            continue;
        }
        candidate.resolution = resolutionOf({
            url: candidate.url,
            status: outcome.status,
            ok: outcome.ok,
            finalUrl: outcome.finalUrl,
            siteHost: params.siteHost
        });
        candidate.title = outcome.title;
    }
};

const summarise = (params: {
    sitemapKind: "absent" | "not-sitemap" | "urlset" | "index";
    claimed: number;
    validated: ReturnType<typeof validateSitemapLocs>;
    candidates: Map<string, Candidate>;
    crawl: Awaited<ReturnType<typeof crawlSite>>;
    entryIdentity: string;
    includable: number;
    included: number;
}): DiscoverySummary => {
    const { validated, candidates, crawl } = params;
    const resolvedSitemapEntries = validated.entries.filter(
        entry => candidates.get(entry.identity)?.resolution.ok
    );
    const status = sitemapStatus({
        kind: params.sitemapKind,
        entries: validated.entries,
        entryIdentity: params.entryIdentity
    });

    return {
        sitemapStatus: status,
        sitemapClaimed: params.claimed,
        sitemapOffHost: validated.offHost,
        sitemapNonPage: validated.nonPage,
        sitemapUnresolved: validated.entries.length - resolvedSitemapEntries.length,
        sitemapUsable: resolvedSitemapEntries.length,
        crawled: crawl.fetched.size + crawl.seen.size,
        crawlDepth: crawl.depth,
        crawlTruncated: crawl.truncated,
        sitemapTruncated: validated.truncated,
        union: params.includable,
        overCap: Math.max(0, params.includable - params.included)
    };
};

/**
 * Discover — the URL list for a run.
 *
 * Both sources run, always, and the results are unioned. The sitemap is never authoritative: it says
 * what a CMS believes it published, which on a custom CMS is frequently not what the site serves, and a
 * sitemap trusted on its own produces a run that looks like it worked. The crawl says what a visitor
 * can actually reach. Where the two disagree, the disagreement is itself the finding, so every URL
 * carries which source produced it and what resolving it returned, and the gate shows both.
 *
 * A sitemap that parses but yields nothing usable — empty, or only the home page — needs no special
 * handling to be ignored: the union with the crawl already produces the list it would have produced
 * with no sitemap at all. It is recorded so the operator can see which of the two happened.
 */
class DiscoverHandlerImpl implements StageHandler.Interface {
    readonly stage = "discover" as const;

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const entryUrl = context.job.siteUrl;
        if (!entryUrl) {
            return Result.fail(
                new ExtractionValidationError("the job has no site URL to discover")
            );
        }
        const entryIdentity = pageIdentity(entryUrl);
        if (!entryIdentity) {
            return Result.fail(
                new ExtractionValidationError(`the job's site URL is not a page URL: ${entryUrl}`)
            );
        }

        const cap = context.job.pageCap;
        const siteHost = foldHost(new URL(entryUrl).host);
        const degraded: string[] = [];

        await context.progress({ message: `Reading the sitemap for ${entryUrl}…` });
        const sitemap = await collectSitemapLocs(entryUrl);
        const validated = validateSitemapLocs(sitemap.locs, entryUrl);
        if (validated.truncated) {
            degraded.push(
                `the sitemap listed more entries than the ${validated.entries.length} this stage carries`
            );
        }

        await context.progress({
            message: `Crawling ${entryUrl} for linked pages…`,
            data: { sitemapClaimed: sitemap.locs.length, sitemapValid: validated.entries.length }
        });
        const crawl = await crawlSite({
            entryUrl,
            // Leave room for the resolve pass, the artifact write and the progress update.
            shouldStop: () => context.isCloseToTimeout(90),
            onLevel: async (level, count) => {
                await context.progress({
                    message: `Crawled depth ${level}: ${count} page(s) so far…`,
                    current: count
                });
            }
        });
        if (crawl.truncated) {
            degraded.push(
                `the crawl stopped at depth ${crawl.depth} with links left to follow — it hit its request ceiling or ran short of time`
            );
        }

        const candidates = unionSources({ crawl, validated, siteHost });

        /*
         * Everything the crawl did not fetch still needs a status: a sitemap-only entry, and a page the
         * crawl saw linked but stopped short of. Both are the cases where "it is in the list" and "it
         * exists" are different claims.
         */
        const pending = [...candidates.entries()].filter(
            ([identity]) => !crawl.fetched.has(identity)
        );
        if (pending.length > 0) {
            await resolvePending({ context, pending, siteHost });
        }

        const includable = [...candidates.values()].filter(candidate => candidate.resolution.ok);
        const unresolvable = [...candidates.values()].filter(candidate => !candidate.resolution.ok);
        const unresolved = unresolvable.map(candidate => {
            const group = pathGroup(candidate.url);
            return toDiscovered(candidate, group);
        });

        if (includable.length === 0) {
            const reason = `nothing on ${entryUrl} resolved: the sitemap claimed ${sitemap.locs.length} URL(s) and the crawl reached ${crawl.fetched.size}, none of which returned a page`;
            return Result.fail(new ExtractionValidationError(reason));
        }

        const byUrl = new Map(includable.map(candidate => [candidate.url, candidate]));
        const includableUrls = includable.map(candidate => candidate.url);
        const sampled = sampleAcrossGroups(includableUrls, cap);

        /*
         * The entry page carries the most design intent, so it leads the list — but only when it
         * resolved. Forcing in a home page that 404s would put a broken page at the front of capture.
         */
        const entryCandidate = candidates.get(entryIdentity);
        const entryIncluded = entryCandidate ? byUrl.get(entryCandidate.url) : undefined;
        if (entryIncluded) {
            const alreadySampled = sampled.some(item => item.url === entryIncluded.url);
            if (!alreadySampled) {
                const group = pathGroup(entryIncluded.url);
                sampled.unshift({ url: entryIncluded.url, group });
                if (sampled.length > cap) {
                    sampled.pop();
                }
            }
        }

        const urls = sampled.flatMap(item => {
            const candidate = byUrl.get(item.url);
            return candidate ? [toDiscovered(candidate, item.group)] : [];
        });

        const discovery = summarise({
            sitemapKind: sitemap.kind,
            claimed: sitemap.locs.length,
            validated,
            candidates,
            crawl,
            entryIdentity,
            includable: includable.length,
            included: urls.length
        });

        const groupNames = urls.map(item => item.group);
        const artifact: DiscoverArtifact = {
            entryUrl,
            discovery,
            groups: [...new Set(groupNames)],
            urls,
            unresolved
        };

        const key = context.artifactKey("urls");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        const headline = `Discovered ${urls.length} page(s): the sitemap claimed ${discovery.sitemapClaimed}, the crawl found ${discovery.crawled}, ${discovery.union} resolved.`;
        await context.progress({
            message: headline,
            current: urls.length,
            total: urls.length,
            data: { entryUrl, cap, ...discovery }
        });
        return Result.ok({
            artifacts: { urls: key },
            counts: { pages: urls.length },
            degraded: degraded.length > 0 ? degraded : undefined
        });
    }
}

export const DiscoverHandler = StageHandler.createImplementation({
    implementation: DiscoverHandlerImpl,
    dependencies: []
});
