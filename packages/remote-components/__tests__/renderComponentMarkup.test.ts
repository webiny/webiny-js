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

    it("renders a file input as the editor stores it, so a shape only the defaults carry fails", async () => {
        // Freehill's Amenities List after the [object Object] check: defaults of { url, src }, read as .src.
        const { markup, files } = await render(
            "AmenitiesList",
            fixture("freehill-amenities-list.jsx.txt")
        );
        expect(markup).not.toContain("resize_28_sbrr8f_dmjckc.jpg");
        expect(files).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "primaryImage", list: false }),
                expect.objectContaining({ path: "secondaryImage", list: false })
            ])
        );
    });

    it("reports a list of file inputs as one list entry", async () => {
        const source = fixture("parkcity-hero-banner.jsx.txt").replace(/img\.src\b/g, "img.src.url");
        const { markup, files } = await render("HeroBanner", source);
        const slides = files.find(file => file.path.endsWith(".src"));
        expect(slides?.list).toBe(true);
        expect(slides?.urls.some(url => markup.includes(url.replace(/&/g, "&amp;")))).toBe(true);
    });

    it("takes a list row's images from the component's own default rows, not its observed text", async () => {
        // Park City's Property Highlights Links: rows observed by their headings, each with an image
        // object whose file field the component read bare.
        const props = JSON.parse(fixture("parkcity-property-highlights.props.json"));
        const bundled = await bundleComponent({
            name: "PropertyHighlightsLinks",
            source: fixture("parkcity-property-highlights.jsx.txt")
        });
        const { markup, files } = renderComponentMarkup(
            bundled.bundled,
            "PropertyHighlightsLinks",
            props
        );
        expect(files).toEqual([expect.objectContaining({ path: "items[].image.src", list: true })]);
        expect(markup).toContain('src="[object Object]"');
    });
});
