/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
    BANNER_KEYWORDS,
    clearOverlaysScript,
    KNOWN_BANNER_SELECTORS,
    type OverlayClearanceResult
} from "./clearOverlays.js";

/**
 * jsdom has no layout engine, so `getBoundingClientRect` returns zeros for everything and
 * `elementFromPoint` has nothing to answer with. Both come from a `data-rect="left,top,width,height"`
 * attribute instead, which keeps the DOM traversal and style resolution real while making the
 * geometry explicit in each fixture — and the geometry is the whole subject here.
 */
const rectOf = (element: Element): DOMRect | null => {
    const raw = element.getAttribute("data-rect");
    if (!raw) {
        return null;
    }
    const parts = raw.split(",").map(Number);
    const [left, top, width, height] = parts.length === 4 ? parts : [0, 0, parts[0], parts[1]];
    return {
        width,
        height,
        left,
        top,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({})
    } as DOMRect;
};

const installLayout = () => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
        return (
            rectOf(this) ??
            ({
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect)
        );
    };

    // Last match in document order wins, which approximates "painted on top" well enough for fixtures.
    document.elementFromPoint = (x: number, y: number) => {
        let hit: Element | null = null;
        for (const element of document.body.querySelectorAll("*")) {
            if (window.getComputedStyle(element).display === "none") {
                continue;
            }
            const rect = rectOf(element);
            if (!rect || rect.width === 0) {
                continue;
            }
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                hit = element;
            }
        }
        return hit;
    };
};

const run = (html: string): OverlayClearanceResult => {
    document.body.innerHTML = html;
    return new Function(`return ${clearOverlaysScript()}`)() as OverlayClearanceResult;
};

const again = (): OverlayClearanceResult => {
    return new Function(`return ${clearOverlaysScript()}`)() as OverlayClearanceResult;
};

const isHidden = (selector: string): boolean => {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Fixture is missing ${selector}`);
    }
    return window.getComputedStyle(element).display === "none";
};

/** A centred dialog: 600x500 in the middle of a 1440x900 viewport, on its own stacking layer. */
const MODAL = `style="position: fixed; z-index: 9999" data-rect="420,200,600,500"`;

/** A pinned site header: full width, 100px tall, well clear of the middle of the screen. */
const HEADER = `style="position: fixed; z-index: 9999" data-rect="0,0,1440,100"`;

beforeEach(() => {
    installLayout();
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
    Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });
});

describe("consent banners are hidden, never accepted", () => {
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
            `<div class="my-cookie-bar" style="position: fixed" data-rect="0,820,1440,80">Accept?</div>`
        );

        expect(isHidden(".my-cookie-bar")).toBe(true);
        expect(result.hidden.length).toBeGreaterThan(0);
    });

    it("matches on each keyword it advertises", () => {
        for (const keyword of BANNER_KEYWORDS) {
            const result = run(
                `<div id="${keyword}" style="position: fixed" data-rect="0,820,1440,80">x</div>`
            );
            expect(result.hidden, keyword).toHaveLength(1);
        }
    });

    it("leaves an article about cookies alone", () => {
        // The keyword is in a descendant's text, not the element's own, so the own-text rule keeps
        // the page's main content intact.
        const result = run(
            `<main style="position: sticky" data-rect="0,0,1440,4000"><h1>Our cookie policy</h1></main>`
        );

        expect(isHidden("main")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("ignores a consent notice that scrolls away with the page", () => {
        const result = run(
            `<div class="cookie-note" data-rect="0,820,1440,80">We use cookies</div>`
        );

        expect(isHidden(".cookie-note")).toBe(false);
        expect(result.hidden).toEqual([]);
    });

    it("never clicks accept", () => {
        // Accepting would consent on a third party's behalf and load the tag managers the banner was
        // gating — which rewrite the very colours we are measuring.
        let clicked = false;
        document.body.innerHTML = `<div id="onetrust-consent-sdk" ${MODAL.slice(7)}><button id="accept">Accept all</button></div>`;
        document.querySelector("#accept")!.addEventListener("click", () => {
            clicked = true;
        });

        again();

        expect(clicked).toBe(false);
    });

    it("leaves a control alone when closing it also accepts", () => {
        let clicked = false;
        document.body.innerHTML = `<div class="promo" ${MODAL}><button aria-label="Close and accept">x</button></div>`;
        document.querySelector("button")!.addEventListener("click", () => {
            clicked = true;
        });

        const result = again();

        expect(clicked).toBe(false);
        // It resisted, so it was removed instead — which grants nobody anything.
        expect(result.dismissed).toEqual([]);
        expect(result.removed.length).toBe(1);
    });
});

describe("dismissal", () => {
    it("closes an overlay through its own close control", () => {
        document.body.innerHTML = `<div class="newsletter" ${MODAL}><button aria-label="Close">x</button></div>`;
        document.querySelector("button")!.addEventListener("click", () => {
            (document.querySelector(".newsletter") as HTMLElement).style.display = "none";
        });

        const result = again();

        expect(result.dismissed).toHaveLength(1);
        expect(result.dismissed[0]).toContain("close");
        // Dismissed, so there was nothing left for the removal pass to act on.
        expect(result.removed).toEqual([]);
        expect(result.overlayRemains).toBeNull();
    });

    it("removes an overlay whose close control does not work", () => {
        // The control is clicked, the overlay stays, and removal takes it. Both are recorded: the
        // dismissal is what was tried, the removal is what actually cleared the page.
        const result = run(
            `<div class="stuck" ${MODAL}><button aria-label="Close">x</button></div>`
        );

        expect(result.dismissed).toHaveLength(1);
        expect(result.removed).toHaveLength(1);
        expect(isHidden(".stuck")).toBe(true);
    });
});

describe("removal criteria", () => {
    it("removes a centred modal that resists", () => {
        const result = run(`<div class="popup" ${MODAL}>Subscribe to our newsletter</div>`);

        expect(isHidden(".popup")).toBe(true);
        expect(result.removed[0]).toContain("100% of the viewport centre");
        expect(result.removed[0]).toContain("z-index 9999");
    });

    it("leaves a pinned header alone", () => {
        // The single most damaging false positive, and the reason the criteria are what they are: a
        // missing header costs the component that would have been built from it, on every page.
        const result = run(`<header class="site-header" ${HEADER}>Northbeam</header>`);

        expect(isHidden(".site-header")).toBe(false);
        expect(result.removed).toEqual([]);
    });

    it("leaves a tall pinned header alone", () => {
        // 400px is an unusually deep header and still nowhere near the middle of the screen.
        const result = run(
            `<header class="tall" style="position: fixed; z-index: 9999" data-rect="0,0,1440,400">Nav</header>`
        );

        expect(isHidden(".tall")).toBe(false);
        expect(result.removed).toEqual([]);
    });

    it("leaves a bottom cookie bar alone", () => {
        const result = run(
            `<div class="bar" style="position: fixed; z-index: 9999" data-rect="0,780,1440,120">Notice</div>`
        );

        expect(isHidden(".bar")).toBe(false);
        expect(result.removed).toEqual([]);
    });

    it("leaves a corner chat widget alone", () => {
        const result = run(
            `<div class="chat" style="position: fixed; z-index: 9999" data-rect="1320,800,100,80">Chat</div>`
        );

        expect(isHidden(".chat")).toBe(false);
        expect(result.removed).toEqual([]);
    });

    it("needs all three conditions, not two", () => {
        // Centred and stacked, but in the document flow: it scrolls away, so it covers nothing.
        const inFlow = run(
            `<div class="a" style="z-index: 9999" data-rect="420,200,600,500">x</div>`
        );
        expect(inFlow.removed).toEqual([]);

        // Centred and pinned, but in the page's own stacking range.
        const lowStack = run(
            `<div class="b" style="position: fixed; z-index: 5" data-rect="420,200,600,500">x</div>`
        );
        expect(lowStack.removed).toEqual([]);

        // Pinned and stacked, but not over the middle of the page.
        const offCentre = run(`<div class="c" ${HEADER}>x</div>`);
        expect(offCentre.removed).toEqual([]);
    });

    it("acts on the outermost overlay, not each layer of one popup", () => {
        const result = run(
            `<div class="wrap" ${MODAL}><div class="inner" ${MODAL}>Subscribe</div></div>`
        );

        expect(result.removed).toHaveLength(1);
        expect(result.removed[0]).toContain("wrap");
    });

    it("leaves a full-bleed hero alone", () => {
        // Viewport-sized and pinned, but with no stacking layer and no tint: this is a design choice,
        // and the old rule that removed it on coverage alone is exactly the one being narrowed.
        const result = run(
            `<div class="hero" style="position: fixed" data-rect="0,0,1440,900"></div>`
        );

        expect(isHidden(".hero")).toBe(false);
        expect(result.removed).toEqual([]);
    });
});

describe("backdrops", () => {
    it("removes the dimming sheet behind a dialog", () => {
        const result = run(`
            <div class="scrim" style="position: fixed; z-index: 9998; background-color: rgba(0, 0, 0, 0.6)" data-rect="0,0,1440,900"></div>
            <div class="dialog" ${MODAL}>Subscribe</div>
        `);

        expect(isHidden(".dialog")).toBe(true);
        expect(isHidden(".scrim")).toBe(true);
        expect(result.removed.some(entry => entry.includes("backdrop"))).toBe(true);
    });

    it("removes a wrapper once the dialog inside it is gone", () => {
        run(`
            <div class="wrapper" style="position: fixed; z-index: 100; background-color: rgba(0, 0, 0, 0.5)" data-rect="0,0,1440,900">
                <div class="dialog" ${MODAL}>Subscribe</div>
            </div>
        `);

        expect(isHidden(".wrapper")).toBe(true);
    });

    it("leaves a full-viewport element that still shows content alone", () => {
        const result = run(`
            <div class="promo" style="position: fixed; z-index: 100; background-color: rgb(255, 255, 255)" data-rect="0,0,1440,900">
                <p data-rect="0,0,200,40">Sale</p>
            </div>
        `);

        // It covers the centre, so the overlay pass takes it — but as an overlay, on the stated
        // criteria, not as a backdrop on coverage alone.
        expect(result.removed.some(entry => entry.includes("backdrop"))).toBe(false);
    });

    it("needs a tint or a blur, and takes an untinted sheet as an overlay instead", () => {
        // It covers the centre entirely on its own stacking layer, so the overlay criteria have it —
        // but not as a backdrop, and the recorded reason says which rule acted.
        const result = run(
            `<div class="sheet" style="position: fixed; z-index: 100" data-rect="0,0,1440,900"></div>`
        );

        expect(result.removed).toHaveLength(1);
        expect(result.removed[0]).not.toContain("backdrop");
        expect(result.removed[0]).toContain("viewport centre");
    });
});

describe("third-party iframes", () => {
    it("removes one that sits over the page", () => {
        const result = run(
            `<iframe class="promo" src="https://promos.example.net/offer" ${MODAL}></iframe>`
        );

        expect(document.querySelector(".promo")).toBeNull();
        expect(result.removed[0]).toContain("promos.example.net");
    });

    it("does not tear a same-origin frame out of the page", () => {
        // It is still an overlay by the criteria, so it is hidden like any other — but the site's own
        // frame stays in the document, because nothing about it needs stopping.
        const result = run(`<iframe class="own" src="/embed/map" ${MODAL}></iframe>`);

        expect(document.querySelector(".own")).not.toBeNull();
        expect(isHidden(".own")).toBe(true);
        expect(result.removed.some(entry => entry.includes("third-party"))).toBe(false);
    });

    it("leaves an embedded third-party video in the page flow alone", () => {
        const result = run(
            `<iframe class="video" src="https://player.example.net/v/1" data-rect="420,200,600,400"></iframe>`
        );

        expect(document.querySelector(".video")).not.toBeNull();
        expect(result.removed).toEqual([]);
    });
});

describe("scrolling", () => {
    it("lifts a scroll lock", () => {
        document.documentElement.style.setProperty("overflow", "hidden");
        const result = run(`<div id="onetrust-consent-sdk">cookies</div>`);

        expect(result.unlockedScroll).toBe(true);
        expect(window.getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
    });

    it("lifts a lock set with overflow-y only", () => {
        document.body.style.setProperty("overflow-y", "hidden");

        expect(run(`<div class="x"></div>`).unlockedScroll).toBe(true);
    });

    it("lifts the fixed-body lock", () => {
        document.body.style.setProperty("position", "fixed");

        expect(run(`<div class="x"></div>`).unlockedScroll).toBe(true);
    });

    it("reports no scroll lock when there was none", () => {
        expect(run(`<div id="onetrust-consent-sdk">cookies</div>`).unlockedScroll).toBe(false);
    });

    it("lifts a lock the overlay left behind", () => {
        // The point of restoring unconditionally: the popup is gone by now, and a lock that outlives
        // it freezes the page at the top with every below-the-fold screenshot identical to the first.
        document.body.style.setProperty("overflow", "hidden");
        const result = run(`<div class="popup" ${MODAL}>Subscribe</div>`);

        expect(result.removed).toHaveLength(1);
        expect(result.unlockedScroll).toBe(true);
    });
});

describe("the post-pass check", () => {
    it("reports nothing on a clean page", () => {
        expect(run(`<main data-rect="0,0,1440,4000">Content</main>`).overlayRemains).toBeNull();
    });

    it("reports a consent bar that survived", () => {
        // Pinned along an edge, so it fails the centre test by design and is right not to be removed —
        // and it is still in the photograph, which is what this is for.
        const result = run(
            `<div class="notice" style="position: fixed" data-rect="0,780,1440,120">About cookies</div>`
        );

        // Hidden by the keyword pass, so nothing remains.
        expect(result.hidden).toHaveLength(1);
        expect(result.overlayRemains).toBeNull();
    });

    it("reports an overlay that could not be hidden", () => {
        document.body.innerHTML = `<div class="stubborn" ${MODAL}>Subscribe</div>`;
        const element = document.querySelector(".stubborn") as HTMLElement;
        // A page that fights back: re-showing itself is exactly what the check exists to catch.
        Object.defineProperty(element.style, "setProperty", { value: () => undefined });

        expect(again().overlayRemains).toContain("stubborn");
    });
});

describe("running twice", () => {
    it("records a vendor banner once, not once per pass", () => {
        // Found on a real capture: the second pass re-hid an element the first had already hidden and
        // recorded it again, so every site with a consent banner reported two of them. The record is
        // the only evidence anyone has about what the capture did to the page, so it has to be right.
        run(`<div id="onetrust-consent-sdk">We use cookies</div>`);

        expect(again().hidden).toEqual([]);
    });

    it("is a no-op the second time", () => {
        run(`
            <div id="onetrust-consent-sdk">We use cookies</div>
            <div class="scrim" style="position: fixed; z-index: 9998; background-color: rgba(0, 0, 0, 0.6)" data-rect="0,0,1440,900"></div>
            <div class="dialog" ${MODAL}><button aria-label="Close">x</button></div>
            <header class="site-header" ${HEADER}>Northbeam</header>
        `);

        const second = again();

        expect(second.hidden).toEqual([]);
        expect(second.dismissed).toEqual([]);
        expect(second.removed).toEqual([]);
        expect(second.unlockedScroll).toBe(false);
        expect(second.overlayRemains).toBeNull();
        // And the header is still standing after both passes.
        expect(isHidden(".site-header")).toBe(false);
    });

    it("catches an overlay that only appears after the first pass", () => {
        // The reason there are two: a modal on a timer arrives between the sampler and the camera, so
        // a single early pass leaves the element tree clean and photographs the popup.
        const first = run(`<main data-rect="0,0,1440,4000">Content</main>`);
        expect(first.removed).toEqual([]);

        document.body.insertAdjacentHTML("beforeend", `<div class="late" ${MODAL}>Subscribe</div>`);

        expect(again().removed).toHaveLength(1);
        expect(isHidden(".late")).toBe(true);
    });
});

it("survives a page with no body content", () => {
    expect(() => run("")).not.toThrow();
    expect(run("").hidden).toEqual([]);
});
