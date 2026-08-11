import { describe, expect, it } from "vitest";
import { extractRoleSignals } from "./roleSignals.js";
import type { SampledElement } from "./samplePage.js";

/** A neutral, non-interactive element with no distinguishing surface — the baseline to override from. */
const el = (overrides: Partial<SampledElement> = {}): SampledElement => ({
    tag: "div",
    area: 100,
    glyphs: 0,
    interactive: false,
    backgroundColor: "transparent",
    borderColor: "rgba(0, 0, 0, 0)",
    borderWidth: "0px",
    borderRadius: "0px",
    boxShadow: "none",
    color: "rgb(0, 0, 0)",
    fontFamily: "Inter",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "24px",
    letterSpacing: "normal",
    paddingTop: "0px",
    paddingLeft: "0px",
    marginTop: "0px",
    gap: "0px",
    ...overrides
});

/** A padded, painted box — the shape the container heuristic is meant to pick up. */
const card = (overrides: Partial<SampledElement> = {}): SampledElement =>
    el({
        backgroundColor: "rgb(255, 255, 255)",
        paddingTop: "16px",
        paddingLeft: "16px",
        ...overrides
    });

/** A real button control — counts as a control whatever its styling. */
const button = (overrides: Partial<SampledElement> = {}): SampledElement =>
    el({ tag: "button", interactive: true, ...overrides });

/** A bare inline text link — interactive, but not a button (no background, border or padding). */
const textLink = (overrides: Partial<SampledElement> = {}): SampledElement =>
    el({ tag: "a", interactive: true, ...overrides });

describe("extractRoleSignals", () => {
    it("measures control radius from button-like controls", () => {
        const signals = extractRoleSignals([
            button({ borderRadius: "8px" }),
            button({ borderRadius: "8px" }),
            button({ borderRadius: "8px" })
        ]);

        expect(signals.radiusControl).toEqual({ value: "8px", samples: 3 });
    });

    it("ignores bare text links so they don't outvote the real buttons", () => {
        // The questdb.com case: a handful of 5px buttons, but the page is full of inline text links
        // with no radius. Those links are interactive yet not buttons, so they must not count.
        const signals = extractRoleSignals([
            button({ borderRadius: "5px" }),
            button({ borderRadius: "5px" }),
            ...Array.from({ length: 12 }, () => textLink({ borderRadius: "0px" }))
        ]);

        expect(signals.radiusControl).toEqual({ value: "5px", samples: 2 });
    });

    it("counts a link styled as a button (background + padding), not just <button>", () => {
        const signals = extractRoleSignals([
            textLink({
                borderRadius: "6px",
                backgroundColor: "rgb(37, 99, 235)",
                paddingTop: "10px"
            })
        ]);

        expect(signals.radiusControl).toEqual({ value: "6px", samples: 1 });
    });

    it("lets the most common value win rather than the largest element (occurrence-weighted)", () => {
        // A single oddly-rounded control (even a big one) must not outvote the design's real radius.
        const signals = extractRoleSignals([
            button({ borderRadius: "8px", area: 100 }),
            button({ borderRadius: "8px", area: 100 }),
            button({ borderRadius: "8px", area: 100 }),
            button({ borderRadius: "20px", area: 100000 })
        ]);

        expect(signals.radiusControl?.value).toBe("8px");
    });

    it("counts a square control (0px) as a real radius, not a missing measurement", () => {
        expect(extractRoleSignals([button({ borderRadius: "0px" })]).radiusControl).toEqual({
            value: "0px",
            samples: 1
        });
    });

    it("measures container radius from cards and ignores bare layout wrappers", () => {
        const signals = extractRoleSignals([
            card({ borderRadius: "12px" }),
            card({ borderRadius: "12px" }),
            // A transparent, unpadded wrapper is not a card — its corners must not count.
            el({ borderRadius: "4px" })
        ]);

        expect(signals.radiusContainer).toEqual({ value: "12px", samples: 2 });
    });

    it("does not treat interactive elements as containers", () => {
        // An interactive card-shaped element feeds control radius, never container radius.
        const signals = extractRoleSignals([
            card({ interactive: true, borderRadius: "8px" }),
            card({ interactive: true, borderRadius: "8px" })
        ]);

        expect(signals.radiusContainer).toBeUndefined();
        expect(signals.radiusControl).toEqual({ value: "8px", samples: 2 });
    });

    it("measures control border width only from controls that actually have a border", () => {
        const signals = extractRoleSignals([
            button({ borderWidth: "1px" }),
            button({ borderWidth: "1px" }),
            // A borderless button says nothing about the control border width.
            button({ borderWidth: "0px" })
        ]);

        expect(signals.borderControl).toEqual({ value: "1px", samples: 2 });
    });

    it("returns nothing when no element matches any role", () => {
        expect(extractRoleSignals([el(), el({ tag: "p", glyphs: 20 })])).toEqual({});
    });
});
