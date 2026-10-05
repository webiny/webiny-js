/**
 * @vitest-environment jsdom
 *
 * The capture evaluator runs inside someone else's page, inside a Lambda, with nothing to attach a
 * debugger to — so it is executed here for real rather than asserted against as a string. The link
 * and media fields in particular are the difference between a migrated navigation that has
 * destinations and one that has only labels, and that is not something to discover on a demo.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { captureEvaluator, type CaptureEvalResult } from "./captureEvaluator.js";
import type { CapturedNode } from "~/domain/artifacts.js";

/**
 * jsdom has no layout engine, so `getBoundingClientRect` returns zeros and every node would be
 * discarded as zero-area. Rects come from a `data-rect="width,height"` attribute instead, which keeps
 * the traversal and style resolution real while making geometry explicit per fixture.
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

const run = (html: string): CaptureEvalResult => {
    document.body.innerHTML = html;
    document.body.setAttribute("data-rect", "1440,900");
    return new Function(`return ${captureEvaluator({ maxNodes: 4000 })}`)() as CaptureEvalResult;
};

const find = (node: CapturedNode, tag: string): CapturedNode | null => {
    if (node.tag === tag) {
        return node;
    }
    for (const child of node.children) {
        const found = find(child, tag);
        if (found) {
            return found;
        }
    }
    return null;
};

/** jsdom's document URL is configured by the test setup, so expectations derive from it. */
const absolute = (path: string): string => new URL(path, window.location.href).href;

beforeEach(installLayout);

describe("captureEvaluator link and media fields", () => {
    it("records a link's destination, resolved to absolute", () => {
        const result = run(`<a href="/pricing" data-rect="80,20">Pricing</a>`);
        const link = find(result.tree as CapturedNode, "a");

        expect(link?.text).toBe("Pricing");
        // A root-relative href resolves against the document URL — that resolution is the point.
        expect(link?.href).toBe(absolute("/pricing"));
    });

    it("keeps an already-absolute destination as it stands", () => {
        const result = run(`<a href="https://meridian.io/about" data-rect="80,20">About</a>`);
        const link = find(result.tree as CapturedNode, "a");

        expect(link?.href).toBe("https://meridian.io/about");
    });

    it("records a non-http destination rather than dropping it", () => {
        const result = run(`<a href="mailto:hi@meridian.io" data-rect="80,20">Email us</a>`);
        const link = find(result.tree as CapturedNode, "a");

        expect(link?.href).toBe("mailto:hi@meridian.io");
    });

    it("records an image's source and alternative text", () => {
        const result = run(`<img src="/logo.svg" alt="Meridian  logo" data-rect="120,40" />`);
        const image = find(result.tree as CapturedNode, "img");

        expect(image?.src).toBe(absolute("/logo.svg"));
        expect(image?.alt).toBe("Meridian logo");
    });

    it("leaves the fields off nodes that have no such thing", () => {
        const result = run(
            `<section data-rect="1440,400"><p data-rect="600,20">Copy</p></section>`
        );
        const paragraph = find(result.tree as CapturedNode, "p");

        expect(paragraph).not.toBeNull();
        expect(paragraph).not.toHaveProperty("href");
        expect(paragraph).not.toHaveProperty("src");
        expect(paragraph).not.toHaveProperty("alt");
    });

    it("leaves `alt` off an image whose alt is empty", () => {
        const result = run(`<img src="/spacer.gif" alt="" data-rect="10,10" />`);
        const image = find(result.tree as CapturedNode, "img");

        expect(image?.src).toBe(absolute("/spacer.gif"));
        expect(image).not.toHaveProperty("alt");
    });

    it("carries destinations for every link in a navigation, in document order", () => {
        const result = run(`
            <nav data-rect="1440,64">
                <a href="/" data-rect="60,20">Home</a>
                <a href="/pricing" data-rect="60,20">Pricing</a>
                <a href="/about" data-rect="60,20">About</a>
            </nav>
        `);

        const nav = find(result.tree as CapturedNode, "nav");
        const links = nav?.children.filter(child => child.tag === "a") ?? [];

        expect(links.map(link => [link.text, link.href])).toEqual([
            ["Home", absolute("/")],
            ["Pricing", absolute("/pricing")],
            ["About", absolute("/about")]
        ]);
    });

    it("caps a destination so a data: URI cannot dominate the tree", () => {
        const long = `data:image/png;base64,${"A".repeat(4000)}`;
        const result = run(`<img src="${long}" data-rect="100,100" />`);
        const image = find(result.tree as CapturedNode, "img");

        expect(image?.src?.length).toBe(1000);
    });

    it("still reports the page title", () => {
        document.title = "Meridian — B2B analytics";
        const result = run(`<p data-rect="600,20">Copy</p>`);

        expect(result.title).toBe("Meridian — B2B analytics");
    });
});

describe("captureEvaluator background images", () => {
    it("records a background image with how it covers its box", () => {
        const result = run(
            `<div data-rect="1440,484" style="background-image:url('https://cdn.example.com/hero.jpg');background-size:cover;background-position:50% 50%;background-repeat:no-repeat;background-color:rgb(166, 95, 70)">Hero</div>`
        );
        const hero = find(result.tree as CapturedNode, "div");

        expect(hero?.background).toEqual({
            url: "https://cdn.example.com/hero.jpg",
            size: "cover",
            position: "50% 50%",
            repeat: "no-repeat"
        });
        // The colour beneath stays on the node; deciding it is invisible is Cluster's job, not the
        // capture's — the capture reports what the page set.
        expect(hero?.styles.backgroundColor).toBe("rgb(166, 95, 70)");
    });

    it("reads a url without quotes, which is how a computed value usually comes back", () => {
        const result = run(
            `<div data-rect="1440,484" style="background-image:url(https://cdn.example.com/a.png)">x</div>`
        );
        expect(find(result.tree as CapturedNode, "div")?.background?.url).toBe(
            "https://cdn.example.com/a.png"
        );
    });

    it("leaves the field off a node with no background image", () => {
        const result = run(`<div data-rect="1440,484" style="background-color:red">x</div>`);
        expect(find(result.tree as CapturedNode, "div")?.background).toBeUndefined();
    });

    it("ignores a gradient, which may be translucent", () => {
        // The field answers "is the colour underneath invisible". A gradient does not establish that,
        // so recording one would suppress a colour the page really shows.
        const result = run(
            `<div data-rect="1440,484" style="background-image:linear-gradient(red, blue)">x</div>`
        );
        expect(find(result.tree as CapturedNode, "div")?.background).toBeUndefined();
    });
});
