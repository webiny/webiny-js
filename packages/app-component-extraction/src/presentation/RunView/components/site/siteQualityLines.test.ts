import { describe, expect, it } from "vitest";
import { siteQualityLines } from "./siteQualityLines.js";

/* 71 Westland's site tenant, read 2026-10-12: 48 files, 2,482,229 bytes; 10 pages. */
const westland = {
    sitemap: { pages: 10, fileId: "f", url: "https://cdn.example/files/f/sitemap.xml" },
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
    seo: { pages: 10, carried: 10 }
};

describe("siteQualityLines", () => {
    it("says what the publish did, in the approved wording", () => {
        expect(siteQualityLines(westland, true).map(line => line.text)).toEqual([
            "Sitemap generated: 10 pages.",
            "Images: 48 files, 2.4 MB (43 WebP, 2 PNG, 2 SVG, 1 GIF), kept in the format the source site served.",
            "Page titles and descriptions carried over from the source site: 10 of 10 pages."
        ]);
        expect(siteQualityLines(westland, true)[0]!.link).toEqual({
            label: "View sitemap",
            url: "https://cdn.example/files/f/sitemap.xml"
        });
    });

    it("never says optimised", () => {
        const text = siteQualityLines(westland, true)
            .map(line => line.text)
            .join(" ");
        expect(text).not.toMatch(/optimi[sz]/i);
    });

    it("says why a sitemap was not generated", () => {
        const [line] = siteQualityLines(
            { sitemap: { error: "The website's domain is not set." } },
            true
        );
        expect(line).toEqual({
            key: "sitemap",
            text: "Sitemap not generated: The website's domain is not set.",
            problem: true
        });
    });

    it("before the first publish, says only that the sitemap comes with it", () => {
        expect(siteQualityLines(undefined, false)).toEqual([
            { key: "sitemap", text: "Sitemap: generated when the site is published." }
        ]);
    });

    it("claims nothing for a site published before the qualities were recorded", () => {
        expect(siteQualityLines(undefined, true)).toEqual([]);
    });
});
