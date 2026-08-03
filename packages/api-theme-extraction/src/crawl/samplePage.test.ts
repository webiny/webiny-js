/**
 * @vitest-environment jsdom
 *
 * The in-page script is the hardest part of extraction to debug once deployed — it runs inside
 * somebody else's page, in a Lambda, with no way to attach to it. So it is executed here for real
 * rather than asserted against as a string.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_MAX_ELEMENTS, samplePageScript, type SampleResult } from "./samplePage.js";

/**
 * jsdom has no layout engine, so `getBoundingClientRect` returns zeros for everything. Rects come
 * from a `data-rect="width,height"` attribute instead, which keeps the DOM traversal and style
 * resolution real while making the geometry explicit in each fixture.
 */
const installLayout = () => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
        const raw = this.getAttribute("data-rect");
        const [width = 0, height = 0] = raw ? raw.split(",").map(Number) : [0, 0];
        return {
            width,
            height,
            top: 0,
            left: 0,
            right: width,
            bottom: height,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect;
    };
};

const run = (html: string, maxElements = DEFAULT_MAX_ELEMENTS): SampleResult => {
    document.body.innerHTML = html;
    return new Function(`return ${samplePageScript({ maxElements })}`)() as SampleResult;
};

beforeEach(installLayout);

describe("samplePageScript element selection", () => {
    it("keeps an element with its own text", () => {
        const result = run(`<p data-rect="600,20">Analytics for growing teams</p>`);

        expect(result.elements).toHaveLength(1);
        expect(result.elements[0]).toMatchObject({ tag: "p", area: 12_000, glyphs: 27 });
    });

    it("keeps an interactive element with no text", () => {
        const result = run(`<button data-rect="120,40"><svg></svg></button>`);

        expect(result.elements).toHaveLength(1);
        expect(result.elements[0]).toMatchObject({ tag: "button", interactive: true, glyphs: 0 });
    });

    it("treats role=button as interactive", () => {
        const result = run(`<div role="button" data-rect="120,40"></div>`);
        expect(result.elements).toHaveLength(1);
    });

    it("drops layout wrappers", () => {
        // A modern marketing page is mostly these; keeping them would bury the signal.
        const result = run(`<div data-rect="1440,900"><div data-rect="1200,600"></div></div>`);
        expect(result.elements).toEqual([]);
    });

    it("counts only an element's own text, not its descendants'", () => {
        // Otherwise every ancestor of a paragraph inherits its glyph count and the weighting is wrong
        // by the depth of the tree.
        const result = run(
            `<section data-rect="1440,400"><p data-rect="600,20">Hello</p></section>`
        );

        expect(result.elements).toHaveLength(1);
        expect(result.elements[0].tag).toBe("p");
    });

    it("still samples an interactive element that wraps its text in a span", () => {
        const result = run(
            `<a href="/x" data-rect="120,40"><span data-rect="100,20">Go</span></a>`
        );

        expect(result.elements.map(element => element.tag).sort()).toEqual(["a", "span"]);
    });

    it("ignores zero-area elements", () => {
        const result = run(`<p data-rect="0,0">Invisible</p><p data-rect="100,0">Also</p>`);
        expect(result.elements).toEqual([]);
    });

    it("ignores elements hidden by style", () => {
        const result = run(`
            <p style="display: none" data-rect="600,20">a</p>
            <p style="visibility: hidden" data-rect="600,20">b</p>
            <p style="opacity: 0" data-rect="600,20">c</p>
        `);

        expect(result.elements).toEqual([]);
    });

    it("reads the computed styles the inventory needs", () => {
        const result = run(
            `<p style="background-color: rgb(31, 111, 235); color: rgb(255, 255, 255); font-size: 18px; border-top-left-radius: 6px; padding-top: 24px" data-rect="600,20">Hi</p>`
        );

        expect(result.elements[0]).toMatchObject({
            backgroundColor: "rgb(31, 111, 235)",
            color: "rgb(255, 255, 255)",
            fontSize: "18px",
            borderRadius: "6px",
            paddingTop: "24px"
        });
    });

    it("lower-cases the tag name", () => {
        expect(run(`<P data-rect="600,20">x</P>`).elements[0].tag).toBe("p");
    });
});

describe("samplePageScript capping", () => {
    const many = (count: number) =>
        Array.from({ length: count }, (_, i) => `<p data-rect="10,${i + 1}">x</p>`).join("");

    it("reports the pre-cap candidate count", () => {
        const result = run(many(20), 5);

        expect(result.candidateCount).toBe(20);
        expect(result.elements).toHaveLength(5);
    });

    it("keeps the largest elements rather than the first", () => {
        // Truncating in document order would bias to the header and drop the hero and footer.
        const result = run(many(20), 3);

        expect(result.elements.map(element => element.area)).toEqual([200, 190, 180]);
    });

    it("does not sort when under the cap", () => {
        const result = run(`<p data-rect="10,1">a</p><p data-rect="10,9">b</p>`, 10);
        expect(result.elements.map(element => element.area)).toEqual([10, 90]);
    });
});

describe("samplePageScript link collection", () => {
    it("labels links by the region they sit in", () => {
        const result = run(`
            <nav><a href="/pricing">Pricing</a></nav>
            <footer><a href="/legal">Legal</a></footer>
            <a href="/blog">Blog</a>
        `);

        expect(result.links).toEqual([
            { href: "/pricing", source: "nav" },
            { href: "/legal", source: "footer" },
            { href: "/blog", source: "body" }
        ]);
    });

    it("recognises the ARIA equivalents", () => {
        const result = run(`
            <div role="navigation"><a href="/a">A</a></div>
            <div role="contentinfo"><a href="/b">B</a></div>
        `);

        expect(result.links.map(link => link.source)).toEqual(["nav", "footer"]);
    });

    it("treats a header link as navigation", () => {
        const result = run(`<header><a href="/a">A</a></header>`);
        expect(result.links[0].source).toBe("nav");
    });

    it("keeps the first occurrence of a repeated href", () => {
        // The same link usually appears in both the nav and the footer, and the nav placement is the
        // stronger signal about the site's structure.
        const result = run(`
            <nav><a href="/pricing">Pricing</a></nav>
            <footer><a href="/pricing">Pricing</a></footer>
        `);

        expect(result.links).toEqual([{ href: "/pricing", source: "nav" }]);
    });

    it("collects links regardless of whether they were sampled", () => {
        const result = run(`<nav><a href="/pricing" data-rect="0,0">Pricing</a></nav>`);

        expect(result.elements).toEqual([]);
        expect(result.links).toHaveLength(1);
    });

    it("skips anchors with no href", () => {
        expect(run(`<a>No target</a>`).links).toEqual([]);
    });
});

describe("samplePageScript resilience", () => {
    it("survives an empty page", () => {
        const result = run("");

        expect(result).toEqual({ elements: [], candidateCount: 0, links: [] });
    });

    it("falls back to the default cap when given a non-finite one", () => {
        expect(() => run(`<p data-rect="10,10">x</p>`, Number.NaN)).not.toThrow();
        expect(run(`<p data-rect="10,10">x</p>`, Number.NaN).elements).toHaveLength(1);
    });
});
