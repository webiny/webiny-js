import { describe, expect, it } from "vitest";
import type { PassCountsDto, SiteResultDto } from "~/shared/types.js";
import { pageCells, siteWideLines } from "./siteResultLines.js";

const none = (components: number): PassCountsDto => ({
    components,
    unmatched: 0,
    accessibility: 0,
    performance: 0,
    responsiveness: 0
});

/*
 * 71 Westland as the Site step reads it on 2026-10-12: published 2026-10-09, before sitemaps, SEO and
 * the generation passes existed. 48 image files, 2,482,229 bytes; 10 pages; 16 components.
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
        }
    ]
};

const text = (result: SiteResultDto | null) => siteWideLines(result).map(line => line.text);

describe("the site-wide result", () => {
    it("says, for a site published before each item existed, that it was not done and what does it", () => {
        expect(text(westland)).toEqual([
            "Sitemap: not generated. Published before this was added. Publishing again generates it.",
            "Images: 48 files, 2.4 MB (43 WebP, 2 PNG, 2 SVG, 1 GIF), kept in the format the source site served.",
            "Page titles and descriptions: not carried over. Published before this was added. Publishing again carries them.",
            "Accessibility pass: not applied. This site's components were generated before it existed.",
            "Performance pass: not applied. This site's components were generated before it existed.",
            "Responsiveness pass: not applied. This site's components were generated before it existed."
        ]);
    });

    it("names the sitemap's domain: the source site's, live once it points here", () => {
        const [sitemap] = siteWideLines({
            ...westland,
            sitemap: {
                pages: 10,
                fileId: "f",
                url: "https://cdn.example/files/f/sitemap.xml",
                domain: "www.71westlandapts.com"
            }
        });
        expect(sitemap).toEqual({
            key: "sitemap",
            text: "Sitemap for www.71westlandapts.com: 10 pages, live once the domain points at this site.",
            link: { label: "View sitemap", url: "https://cdn.example/files/f/sitemap.xml" }
        });
    });

    it("says a sitemap written before it used the site's domain lists preview addresses", () => {
        const [sitemap] = siteWideLines({
            ...westland,
            sitemap: { pages: 3, fileId: "f", url: "https://cdn.example/files/f/sitemap.xml" }
        });
        expect(sitemap!.text).toBe(
            "Sitemap: lists preview addresses, not the site's own domain. Publishing again regenerates it."
        );
    });

    it("says how many components carried a pass, with the beta label, and never calls the image line optimised", () => {
        const lines = siteWideLines({
            ...westland,
            passes: { ...none(16), accessibility: 12, performance: 16, responsiveness: 16 }
        });
        const beta = lines.filter(line => line.beta).map(line => line.text);
        expect(beta).toEqual([
            "Accessibility pass applied in generation to 12 of 16 components: semantic elements, alt text from the source site, form labels, heading levels. Not checked against WCAG.",
            "Performance pass applied in generation: image dimensions set.",
            "Responsiveness pass applied in generation: fluid widths, no sideways scrolling, stacking at narrow widths, tap targets."
        ]);
        expect(lines.map(line => line.text).join(" ")).not.toMatch(/optimi[sz]/i);
    });

    it("says responsiveness is generic wherever it is shown", () => {
        const line = siteWideLines(westland).find(item => item.key === "responsiveness")!;
        expect(line.note).toMatch(/^Generic: .*No mobile capture of the source stands behind it\./);
    });

    it("before the first publish, says only that the sitemap comes with it", () => {
        expect(text(null)).toEqual(["Sitemap: generated when the site is published."]);
    });
});

describe("a page's cells", () => {
    it("say zero with why, for 71 Westland's home page", () => {
        const cells = pageCells(westland.pages[0]!);
        expect(cells.seo).toEqual({
            label: "Not carried over",
            full: "Not carried over: published before this was added. Publishing again carries them.",
            muted: true
        });
        expect(cells.images.label).toBe("11 · 10 WebP, 1 SVG");
        expect(cells.passes.accessibility).toEqual({
            label: "0 of 7",
            full: "Accessibility pass: not applied. This page's components were generated before it existed.",
            muted: true
        });
    });

    it("count the components on this page that carried a pass", () => {
        const cells = pageCells({
            ...westland.pages[0]!,
            passes: { ...none(7), accessibility: 5 }
        });
        expect(cells.passes.accessibility).toEqual({
            label: "5 of 7",
            full: "Accessibility pass applied to 5 of 7 components on this page.",
            muted: false
        });
    });
});
