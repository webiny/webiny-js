/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
    BANNER_KEYWORDS,
    dismissBannersScript,
    KNOWN_BANNER_SELECTORS,
    type BannerDismissalResult
} from "./dismissBanners.js";

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

const run = (html: string): BannerDismissalResult => {
    document.body.innerHTML = html;
    return new Function(`return ${dismissBannersScript()}`)() as BannerDismissalResult;
};

const isHidden = (selector: string): boolean => {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Fixture is missing ${selector}`);
    }
    return window.getComputedStyle(element).display === "none";
};

beforeEach(() => {
    installLayout();
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
    Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });
});

describe("dismissBannersScript", () => {
    it("hides a known vendor container", () => {
        const result = run(`<div id="onetrust-consent-sdk">We use cookies</div>`);

        expect(isHidden("#onetrust-consent-sdk")).toBe(true);
        expect(result.hidden).toContain("#onetrust-consent-sdk");
    });

    it("covers every selector it claims to", () => {
        for (const selector of KNOWN_BANNER_SELECTORS) {
            const tag = selector.startsWith("#")
                ? `<div id="${selector.slice(1)}"></div>`
                : `<div class="${selector.slice(1)}"></div>`;

            const result = run(tag);
            expect(result.hidden, selector).toContain(selector);
        }
    });

    it("catches a bespoke banner by its class name", () => {
        const result = run(
            `<div class="my-cookie-bar" style="position: fixed" data-rect="1440,80">Accept?</div>`
        );

        expect(isHidden(".my-cookie-bar")).toBe(true);
        expect(result.hidden.length).toBeGreaterThan(0);
    });

    it("matches on each keyword it advertises", () => {
        for (const keyword of BANNER_KEYWORDS) {
            const result = run(
                `<div id="${keyword}" style="position: fixed" data-rect="1440,80">x</div>`
            );
            expect(result.hidden, keyword).toHaveLength(1);
        }
    });

    it("leaves a sticky header alone", () => {
        // The single most damaging false positive: a pinned header is real design signal, and hiding
        // it would remove the brand colour from the inventory entirely.
        const result = run(
            `<header class="site-header" style="position: sticky" data-rect="1440,72">Northbeam</header>`
        );

        expect(isHidden(".site-header")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("leaves an article about cookies alone", () => {
        // The keyword is in a descendant's text, not the element's own, so the own-text rule keeps
        // the page's main content intact.
        const result = run(
            `<main style="position: sticky" data-rect="1440,4000"><h1>Our cookie policy</h1></main>`
        );

        expect(isHidden("main")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("ignores a consent notice that scrolls away with the page", () => {
        // Not pinned means not covering anything, so it is part of the design rather than an overlay.
        const result = run(`<div class="cookie-note" data-rect="1440,80">We use cookies</div>`);

        expect(isHidden(".cookie-note")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("does not click anything", () => {
        // Accepting would consent on a third party's behalf and load the tag managers the banner was
        // gating — which rewrite the very colours we are measuring.
        let clicked = false;
        document.body.innerHTML = `<div id="onetrust-consent-sdk"><button id="onetrust-accept-btn-handler">Accept all</button></div>`;
        document.querySelector("#onetrust-accept-btn-handler")!.addEventListener("click", () => {
            clicked = true;
        });

        new Function(`return ${dismissBannersScript()}`)();

        expect(clicked).toBe(false);
    });

    it("lifts a scroll lock", () => {
        document.documentElement.style.setProperty("overflow", "hidden");
        const result = run(`<div id="onetrust-consent-sdk">cookies</div>`);

        expect(result.unlockedScroll).toBe(true);
        expect(window.getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
    });

    it("reports no scroll lock when there was none", () => {
        expect(run(`<div id="onetrust-consent-sdk">cookies</div>`).unlockedScroll).toBe(false);
    });

    it("removes a full-viewport scrim once a banner is found", () => {
        const result = run(`
            <div id="onetrust-consent-sdk">cookies</div>
            <div class="scrim" style="position: fixed" data-rect="1440,900"></div>
        `);

        expect(isHidden(".scrim")).toBe(true);
        expect(result.hidden).toContain("[full-viewport scrim]");
    });

    it("leaves a full-bleed hero alone when no banner was found", () => {
        // Without a banner there is nothing to be scrimming, so a viewport-sized fixed element is
        // just a design choice.
        const result = run(`<div class="hero" style="position: fixed" data-rect="1440,900"></div>`);

        expect(isHidden(".hero")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("does not mistake a content-bearing overlay for a scrim", () => {
        run(`
            <div id="onetrust-consent-sdk">cookies</div>
            <div class="promo" style="position: fixed" data-rect="1440,900"><p>Sale</p></div>
        `);

        expect(isHidden(".promo")).toBe(false);
    });

    it("skips a banner that is already hidden", () => {
        const result = run(
            `<div class="cookie-bar" style="position: fixed; display: none" data-rect="1440,80">x</div>`
        );

        expect(result.hidden).toEqual([]);
    });

    it("hides every instance when a vendor renders more than one", () => {
        const result = run(`<div class="cc-window">a</div><div class="cc-window">b</div>`);
        expect(result.hidden.filter(entry => entry === ".cc-window")).toHaveLength(2);
    });

    it("survives a page with no body content", () => {
        expect(() => run("")).not.toThrow();
        expect(run("").hidden).toEqual([]);
    });
});
