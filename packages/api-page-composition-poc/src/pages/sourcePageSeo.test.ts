import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { pageSeo, readSourceDescription } from "./sourcePageSeo.js";

/*
 * The raw HTML capture stored for three real pages (2026-10-09 and 2026-10-10 runs): 71 Westland's
 * home and contact pages, and Take 3's home page. Each declares a canonical URL on the source domain,
 * and each body carries SVG `<title>` elements ("Cookies Button", "Search Icon").
 */
const sourceDom = (name: string): string =>
    gunzipSync(readFileSync(new URL(`./__fixtures__/${name}.html.gz`, import.meta.url))).toString(
        "utf8"
    );
const westlandHome = sourceDom("source-dom-71westland-home");
const westlandContact = sourceDom("source-dom-71westland-contact");
const take3Home = sourceDom("source-dom-take3-home");
/* webiny.com's home page (2026-10-12 rehearsal run): Next.js streamed its metadata to the end of the body. */
const webinyHome = sourceDom("source-dom-webiny-home");

describe("readSourceDescription", () => {
    it("reads each page's own meta description", () => {
        expect(readSourceDescription(westlandHome)).toMatch(
            /^71 Westland Apartments offers apartments for rent in Boston, MA/
        );
        expect(readSourceDescription(take3Home)).toMatch(
            /^Park City Place offers apartments for rent in Bridgeport, CT/
        );
    });

    it("decodes entities: the contact page's description has a non-breaking space", () => {
        expect(readSourceDescription(westlandContact)).toBe(
            "Got questions and concerns? Visit our website and fill out the form today and someone at 71 Westland Apartments will get back to you shortly."
        );
    });

    it("reads a description streamed after the head, as webiny.com's home page has it", () => {
        expect(webinyHome.indexOf('name="description"')).toBeGreaterThan(
            webinyHome.toLowerCase().indexOf("</head")
        );
        expect(readSourceDescription(webinyHome)).toMatch(
            /^Webiny is an open-source, self-hosted headless CMS platform built for enterprise scale\./
        );
    });

    it("is undefined for a page that declares none", () => {
        const without = westlandHome.replace(/<meta name="description"[^>]*>/, "");
        expect(without).not.toBe(westlandHome);
        expect(readSourceDescription(without)).toBeUndefined();
    });
});

describe("pageSeo", () => {
    it("carries the title and description, and never the source's canonical URL", () => {
        expect(westlandContact).toMatch(
            /<link rel="canonical" href="https:\/\/www\.71westlandapts\.com\/apartments\/ma\/boston\/contact">/
        );
        const seo = pageSeo({
            declaredTitle: "Contact Us | 71 Westland Apartments",
            description: readSourceDescription(westlandContact)
        });
        expect(Object.keys(seo).sort()).toEqual(["description", "metaTags", "title"]);
        expect(seo.title).toBe("Contact Us | 71 Westland Apartments");
        expect(JSON.stringify(seo)).not.toContain("71westlandapts.com");
    });

    it("puts forward no title the source did not declare", () => {
        expect(pageSeo({ declaredTitle: "  ", description: "A page." })).toEqual({
            description: "A page.",
            metaTags: []
        });
    });

    it("always carries a meta tag list, which the website reads without checking", () => {
        /*
         * The website's metadata reads `page.properties.seo?.metaTags.reduce(...)`
         * (next-website-migration-tool, app/(site)/[[...slug]]/page.tsx:56). With no `seo` that is
         * undefined; with a `seo` that has no `metaTags` it throws, and the page is served with no
         * <title> and no description. The rehearsal site's pages were, for minutes, on 2026-10-12.
         */
        const read = (seo: { metaTags?: Array<{ name: string; content: string }> }) =>
            seo.metaTags!.reduce((acc, item) => ({ ...acc, [item.name]: item.content }), {});
        for (const seo of [
            pageSeo({}),
            pageSeo({ declaredTitle: "Home", description: "A page." }),
            pageSeo({ description: readSourceDescription(webinyHome) })
        ]) {
            expect(() => read(seo)).not.toThrow();
        }
    });
});
