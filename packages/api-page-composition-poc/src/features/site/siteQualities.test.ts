import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSitemap, countGenerationPasses, countSeo, summariseImages } from "./siteQualities.js";

/* 71 Westland's site tenant File Manager, read 2026-10-12: 48 files. */
const westlandFiles = (
    JSON.parse(
        readFileSync(new URL("./__fixtures__/westland-site-files.json", import.meta.url), "utf8")
    ) as { files: Array<{ fileId: string; contentType: string; size: number }> }
).files;

/* The validation site's tenant: 3 published pages and the first build's 3 unpublished copies. */
const validationPages = (
    JSON.parse(
        readFileSync(
            new URL("../../pages/__fixtures__/validation-site-tenant.json", import.meta.url),
            "utf8"
        )
    ) as { pages: Array<{ status: string; path: string }> }
).pages;

describe("summariseImages", () => {
    it("counts 71 Westland's files by stored format", () => {
        expect(summariseImages(westlandFiles)).toEqual({
            files: 48,
            bytes: 2482229,
            byType: [
                { type: "image/webp", files: 43 },
                { type: "image/png", files: 2 },
                { type: "image/svg+xml", files: 2 },
                { type: "image/gif", files: 1 }
            ]
        });
    });

    it("counts a file once however many captured images are that file", () => {
        const first = westlandFiles[0]!;
        const summary = summariseImages([first, { ...first }, { ...first }]);
        expect(summary.files).toBe(1);
        expect(summary.bytes).toBe(first.size);
    });

    it("reads the type before any parameter", () => {
        expect(
            summariseImages([{ fileId: "a", contentType: "image/webp; charset=binary", size: 1 }])
                .byType
        ).toEqual([{ type: "image/webp", files: 1 }]);
    });
});

describe("buildSitemap", () => {
    const published = validationPages.filter(page => page.status === "published");
    const pageUrl = (path: string) => `https://site.example${path}?wb.tenant=validationwebinycom`;

    it("lists each published page once, at the address it is served from", () => {
        const sitemap = buildSitemap({
            pages: published.map(page => ({
                path: page.path,
                savedOn: "2026-10-12T09:00:00.000Z"
            })),
            pageUrl
        });
        expect(sitemap.pages).toBe(3);
        expect(sitemap.xml).toContain(
            "<loc>https://site.example/?wb.tenant=validationwebinycom</loc>"
        );
        expect(sitemap.xml).toContain(
            "<loc>https://site.example/forms/evaluating-webiny-as-a-payload-alternative?wb.tenant=validationwebinycom</loc>"
        );
        expect(sitemap.xml).toContain("<lastmod>2026-10-12T09:00:00.000Z</lastmod>");
        expect(sitemap.xml.match(/<url>/g)).toHaveLength(3);
    });

    it("escapes the address for XML", () => {
        const sitemap = buildSitemap({
            pages: [{ path: "/" }],
            pageUrl: path => `https://site.example${path}?wb.tenant=a&wb.x=b`
        });
        expect(sitemap.xml).toContain("<loc>https://site.example/?wb.tenant=a&amp;wb.x=b</loc>");
        expect(sitemap.xml).not.toContain("<lastmod>");
    });
});

describe("countSeo", () => {
    it("counts pages carrying both a title and a description", () => {
        expect(
            countSeo([
                { properties: { seo: { title: "Home", description: "A page." } } },
                { properties: { seo: { title: "About" } } },
                { properties: { seo: { title: " ", description: "A page." } } },
                { properties: {} }
            ])
        ).toEqual({ pages: 4, carried: 1 });
    });
});

describe("countGenerationPasses", () => {
    it("counts a pass only where a component's prompt carried every one of its instructions", () => {
        const all = [
            "quality.alt-input",
            "quality.semantic-elements",
            "quality.heading-level",
            "quality.form-labels",
            "quality.focus-visible",
            "quality.image-size"
        ];
        expect(
            countGenerationPasses([
                { qualityInstructions: all },
                { qualityInstructions: ["quality.image-size"] },
                { qualityInstructions: all.filter(id => id !== "quality.focus-visible") },
                {}
            ])
        ).toEqual({ components: 4, accessibility: 1, performance: 3 });
    });

    it("counts nothing for components generated before the instructions existed", () => {
        expect(countGenerationPasses([{}, {}])).toEqual({
            components: 2,
            accessibility: 0,
            performance: 0
        });
    });
});
