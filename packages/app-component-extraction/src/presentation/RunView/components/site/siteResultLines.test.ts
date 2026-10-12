import { describe, expect, it } from "vitest";
import type { PassCountsDto, SiteResultDto } from "~/shared/types.js";
import {
    pageCells,
    qualityGroups,
    qualitySummary,
    siteWideNotYet,
    WCAG_QUALIFIER
} from "./siteResultLines.js";

const none = (components: number): PassCountsDto => ({
    components,
    unmatched: 0,
    accessibility: 0,
    performance: 0,
    responsiveness: 0
});

const page = (path: string, seo: boolean, components: number) => ({
    pageId: path,
    path,
    seo,
    images: { files: 1, bytes: 1, byType: [{ type: "image/svg+xml", files: 1 }] },
    passes: none(components)
});

/*
 * 71 Westland as the deployed query returned it on 2026-10-12: published 2026-10-09, before sitemaps,
 * SEO and the generation passes existed. 48 image files, 2,482,229 bytes; 10 pages; 16 components.
 */
const westland: SiteResultDto = {
    runId: "6ac902f361abbb0002c84963#0001",
    sitemap: null,
    images: {
        files: 48,
        bytes: 2482229,
        byType: [
            { type: "image/webp", files: 43 },
            { type: "image/png", files: 2 },
            { type: "image/svg+xml", files: 2 },
            { type: "image/gif", files: 1 }
        ]
    },
    seo: { pages: 10, carried: 0 },
    passes: none(16),
    pages: [
        {
            pageId: "p1",
            path: "/",
            seo: false,
            images: {
                files: 11,
                bytes: 1,
                byType: [
                    { type: "image/webp", files: 10 },
                    { type: "image/svg+xml", files: 1 }
                ]
            },
            passes: none(7)
        },
        page("/apartments/ma/boston/amenities", false, 6)
    ]
};

/* The site-tenant rehearsal on 2026-10-12: a sitemap from before the source domain, SEO on 3 of 3. */
const rehearsal: SiteResultDto = {
    ...westland,
    runId: "6accad34e2d54000029b484c#0001",
    sitemap: {
        fileId: "afce7538-907b-436b-a036-729bb098741a",
        pages: 3,
        url: "https://d1mp23blxyssy7.cloudfront.net/files/afce7538-907b-436b-a036-729bb098741a/sitemap.xml"
    },
    seo: { pages: 3, carried: 3 },
    pages: [page("/", true, 13), page("/docs", true, 2), page("/learn", true, 1)]
};

const states = (result: SiteResultDto) => {
    const groups = qualityGroups(result);
    return [...groups.facts, ...groups.passes].map(item => [item.key, item.done, item.state]);
};

describe("the six qualities", () => {
    it("on a site published before most of it existed, say which arrive at the next publish", () => {
        expect(states(westland)).toEqual([
            ["sitemap", false, "Arrives when you publish again"],
            ["images", true, "48 files"],
            ["seo", false, "Arrives when you publish again"],
            ["accessibility", false, "Not yet"],
            ["performance", false, "Not yet"],
            ["responsiveness", false, "Not yet"]
        ]);
        expect(qualitySummary(qualityGroups(westland))).toEqual({
            text: "1 of 6 on this site · 5 not yet",
            publishPrompt: "Publishing again brings 2 of these."
        });
    });

    it("never promise the passes at the next publish, and name regeneration as what adds them", () => {
        for (const item of qualityGroups(westland).passes) {
            expect(item.arrivesOnPublish).toBeUndefined();
            expect(item.state).not.toMatch(/publish/i);
            expect(item.detail).toBe("The components were generated before this pass existed.");
            expect(item.action).toBe(
                "Regenerating the components with its instruction on adds it."
            );
        }
    });

    it("on the rehearsal, count a preview-address sitemap as not yet, with its link kept", () => {
        const [sitemap, , seo] = qualityGroups(rehearsal).facts;
        expect(sitemap).toMatchObject({
            done: false,
            arrivesOnPublish: true,
            detail: "The current one lists preview addresses, not the site's own domain.",
            link: { label: "View sitemap" }
        });
        expect(seo).toMatchObject({ done: true, detail: "From the source site, on 3 of 3 pages." });
        expect(qualitySummary(qualityGroups(rehearsal))).toEqual({
            text: "2 of 6 on this site · 4 not yet",
            publishPrompt: "Publishing again brings one of these."
        });
    });

    it("keep the WCAG qualifier on the accessibility card when the pass is applied", () => {
        const applied = qualityGroups({
            ...westland,
            passes: { ...none(13), accessibility: 13, performance: 13, responsiveness: 13 }
        }).passes;
        expect(applied[0]).toMatchObject({
            done: true,
            state: "Applied in generation",
            qualifier: WCAG_QUALIFIER
        });
        expect(applied[0]!.detail).toMatch(/^To 13 of 13 components\./);
        expect(applied.map(item => item.detail).join(" ")).not.toMatch(/optimi[sz]|complian/i);
    });

    it("say responsiveness is generic wherever it is shown", () => {
        expect(qualityGroups(westland).passes[2]!.note).toMatch(
            /^Generic: .*No mobile capture of the source stands behind it\./
        );
    });
});

describe("the page table", () => {
    it("say a column once when it is not yet on every page", () => {
        expect(siteWideNotYet(westland)).toEqual({
            seo: true,
            passes: { accessibility: true, performance: true, responsiveness: true },
            allPasses: true
        });
        expect(siteWideNotYet(rehearsal).seo).toBe(false);
    });

    it("keep per-cell states where pages differ", () => {
        const mixed = {
            ...westland,
            pages: [
                { ...westland.pages[0]!, passes: { ...none(7), accessibility: 5 } },
                westland.pages[1]!
            ]
        };
        expect(siteWideNotYet(mixed).passes).toEqual({
            accessibility: false,
            performance: true,
            responsiveness: true
        });
        expect(pageCells(mixed.pages[0]!).passes.accessibility).toMatchObject({
            label: "5 of 7",
            notYet: false
        });
        expect(pageCells(mixed.pages[1]!).passes.accessibility).toMatchObject({
            label: "Not yet",
            notYet: true
        });
    });

    it("write a page's images as a count with its formats", () => {
        expect(pageCells(westland.pages[0]!).images.label).toBe("11 (10 WebP, 1 SVG)");
    });
});
