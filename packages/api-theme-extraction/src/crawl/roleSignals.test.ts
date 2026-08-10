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

describe("extractRoleSignals", () => {
    it("measures control radius from interactive elements", () => {
        const signals = extractRoleSignals([
            el({ interactive: true, borderRadius: "8px" }),
            el({ interactive: true, borderRadius: "8px" }),
            el({ interactive: true, borderRadius: "8px" })
        ]);

        expect(signals.radiusControl).toEqual({ value: "8px", samples: 3 });
    });

    it("lets the most common value win rather than the largest element (occurrence-weighted)", () => {
        // A single oddly-rounded control (even a big one) must not outvote the design's real radius.
        const signals = extractRoleSignals([
            el({ interactive: true, borderRadius: "8px", area: 100 }),
            el({ interactive: true, borderRadius: "8px", area: 100 }),
            el({ interactive: true, borderRadius: "8px", area: 100 }),
            el({ interactive: true, borderRadius: "20px", area: 100000 })
        ]);

        expect(signals.radiusControl?.value).toBe("8px");
    });

    it("counts a square control (0px) as a real radius, not a missing measurement", () => {
        expect(
            extractRoleSignals([el({ interactive: true, borderRadius: "0px" })]).radiusControl
        ).toEqual({
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
            el({ interactive: true, borderWidth: "1px" }),
            el({ interactive: true, borderWidth: "1px" }),
            // A borderless button says nothing about the control border width.
            el({ interactive: true, borderWidth: "0px" })
        ]);

        expect(signals.borderControl).toEqual({ value: "1px", samples: 2 });
    });

    it("returns nothing when no element matches any role", () => {
        expect(extractRoleSignals([el(), el({ tag: "p", glyphs: 20 })])).toEqual({});
    });
});
