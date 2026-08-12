import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type { DiscoverArtifact } from "~/domain/artifacts.js";
import { sampleAcrossGroups } from "./grouping.js";
import { extractSameOriginLinks, parseSitemapUrls } from "./sitemap.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

// Neutral, honest UA. TODO: source from the shared crawl-policy module once Discover's robots handling
// moves there — see the `@webiny/site-capture` README note about not copying theme extraction's robots.
const USER_AGENT = "Mozilla/5.0 (compatible; WebinyBot/1.0; +https://www.webiny.com)";

const fetchText = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
        return response.ok ? await response.text() : null;
    } catch {
        // A network failure on discovery is not fatal — the caller falls through / degrades.
        return null;
    }
};

/**
 * Discover — the URL list for a run. Tries the sitemap first, falls back to a link crawl of the entry
 * page, then samples across path groups so a content-heavy section does not crowd out the rest.
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
        const cap = context.job.pageCap;
        await context.progress({ message: `Discovering pages on ${entryUrl}…` });

        let source: DiscoverArtifact["source"] = "sitemap";
        let urls: string[] = [];
        try {
            const sitemap = await fetchText(new URL("/sitemap.xml", entryUrl).toString());
            if (sitemap) {
                urls = parseSitemapUrls(sitemap);
            }
        } catch {
            // A malformed entry URL falls through to the crawl, which reports the real problem.
        }

        if (urls.length === 0) {
            source = "crawl";
            const html = await fetchText(entryUrl);
            urls = html ? extractSameOriginLinks(html, entryUrl) : [];
        }

        // The entry page carries the most design intent — keep it first and always included.
        const sampled = sampleAcrossGroups(
            [entryUrl, ...urls.filter(url => url !== entryUrl)],
            cap
        );
        if (!sampled.some(item => item.url === entryUrl)) {
            sampled.unshift({ url: entryUrl, group: "root" });
            if (sampled.length > cap) {
                sampled.pop();
            }
        }

        const artifact: DiscoverArtifact = {
            entryUrl,
            source,
            groups: [...new Set(sampled.map(item => item.group))],
            urls: sampled
        };

        const key = context.artifactKey("urls");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.progress({
            message: `Discovered ${sampled.length} URL(s) via ${source}.`,
            current: sampled.length,
            total: sampled.length,
            data: { entryUrl, source, groups: artifact.groups, cap }
        });
        return Result.ok({ artifacts: { urls: key }, counts: { pages: sampled.length } });
    }
}

export const DiscoverHandler = StageHandler.createImplementation({
    implementation: DiscoverHandlerImpl,
    dependencies: []
});
