import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { siteResult, type SiteResultSources } from "./siteResult.js";

/*
 * Read 2026-10-12: the site-tenant rehearsal (approves into its tenant; published today, so its pages
 * carry SEO) and 71 Westland (an older site: published 2026-10-09, no signature map on its record).
 */
interface Fixture {
    pages: SiteResultSources["pages"];
    components: SiteResultSources["components"];
    files: SiteResultSources["files"];
    generated: SiteResultSources["generated"];
    promoted: Array<{ signature: string; componentId: string }>;
    promoteTenantId?: string;
    tenantId: string;
    siteComponents: Record<string, string>;
}
const sites = (
    JSON.parse(
        readFileSync(new URL("./__fixtures__/site-result-sources.json", import.meta.url), "utf8")
    ) as { sites: Record<"rehearsal" | "westland", Fixture> }
).sites;

const sourcesOf = (site: Fixture, generated = site.generated): SiteResultSources => ({
    pages: site.pages,
    components: site.components,
    files: site.files,
    generated,
    signatureById: new Map([
        ...(site.promoteTenantId === site.tenantId
            ? site.promoted.map(item => [item.componentId, item.signature] as [string, string])
            : []),
        ...Object.entries(site.siteComponents).map(([signature, id]) => [id, signature] as [string, string])
    ])
});

describe("siteResult", () => {
    it("reads each page's SEO as it is published: carried on the rehearsal, not on 71 Westland", () => {
        const rehearsal = siteResult(sourcesOf(sites.rehearsal));
        expect(rehearsal.seo).toEqual({ pages: 3, carried: 3 });
        const westland = siteResult(sourcesOf(sites.westland));
        expect(westland.seo).toEqual({ pages: 10, carried: 0 });
    });

    it("counts the images each page's components use, by format, matched to the site's files", () => {
        const westland = siteResult(sourcesOf(sites.westland));
        const home = westland.pages.find(page => page.path === "/")!;
        expect(home.images.files).toBe(11);
        expect(home.images.byType).toEqual([
            { type: "image/webp", files: 10 },
            { type: "image/svg+xml", files: 1 }
        ]);
        expect(westland.images.files).toBe(48);
    });

    it("counts a page's distinct components, not its placements", () => {
        const home = siteResult(sourcesOf(sites.rehearsal)).pages.find(page => page.path === "/")!;
        expect(home.passes.components).toBe(13);
    });

    it("reads zero passes on both sites today, and matches every placed component to its record", () => {
        for (const site of [sites.rehearsal, sites.westland]) {
            const result = siteResult(sourcesOf(site));
            expect(result.passes).toMatchObject({
                unmatched: 0,
                accessibility: 0,
                performance: 0,
                responsiveness: 0
            });
            expect(result.passes.components).toBe(16);
        }
    });

    it("counts a pass from the component's own record, through its Library id, past keep-both names", () => {
        // The rehearsal places "Feature Highlights" and "Feature Highlights (2)": two components with
        // one generated name, told apart only by the approval's ids.
        const all = [
            "quality.alt-input",
            "quality.semantic-elements",
            "quality.heading-level",
            "quality.form-labels",
            "quality.focus-visible"
        ];
        const site = sites.rehearsal;
        const copy = site.components.find(c => c.name.endsWith("/Feature Highlights (2)"))!;
        const signature = site.promoted.find(p => p.componentId === copy.id)!.signature;
        const generated = site.generated.map(record =>
            record.signature === signature ? { ...record, qualityInstructions: all } : record
        );
        const result = siteResult(sourcesOf(site, generated));
        expect(result.passes.accessibility).toBe(1);
        const placing = result.pages.filter(page => page.passes.accessibility === 1);
        expect(placing.length).toBeGreaterThan(0);
        expect(result.passes.performance).toBe(0);
    });
});
