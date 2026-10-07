import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bundleComponent, renderComponentMarkup } from "../src/api/bundler/index.js";

/*
 * Real generated components, from the component-extraction baseline: a header whose logo rendered
 * blank and a hero whose background photographs did. Both read a file input's object as its URL.
 */
const fixture = (name: string) =>
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const render = async (name: string, source: string) => {
    const bundled = await bundleComponent({ name, source });
    return renderComponentMarkup(bundled.bundled, name, []);
};

describe("renderComponentMarkup", () => {
    it("shows a file input read as its URL in an attribute", async () => {
        const { markup } = await render("SiteHeader", fixture("freehill-site-header.jsx.txt"));
        expect(markup).toContain('src="[object Object]"');
    });

    it("shows a file input read as its URL in an inline style", async () => {
        const { markup } = await render("HeroBanner", fixture("parkcity-hero-banner.jsx.txt"));
        expect(markup).toContain("url([object Object])");
    });

    it("renders the URL once the component reads `.url`", async () => {
        const source = fixture("freehill-site-header.jsx.txt").replace(
            /src=\{logo\.src\}/,
            "src={logo.src.url}"
        );
        const { markup, text } = await render("SiteHeader", source);
        expect(markup).not.toContain("[object Object]");
        expect(markup).toContain("Logo_xkmkne.png");
        expect(text).toContain("Apply Now");
    });
});
