import { describe, expect, it } from "vitest";
import { tallyColors, type StyleObservation, type WeightedValue } from "~/crawl/inventory.js";
import { toObservations } from "~/crawl/toObservations.js";
import type { SampledElement } from "~/crawl/samplePage.js";
import {
    assessDarkMode,
    buildModelPayload,
    PAYLOAD_CAPS,
    planScreenshots,
    toPayloadValues
} from "./payload.js";

const weighted = (value: string, weight: number): WeightedValue => ({
    value,
    weight,
    occurrences: 1,
    properties: ["background"]
});

const element = (overrides: Partial<SampledElement> = {}): SampledElement => ({
    tag: "div",
    area: 100,
    glyphs: 0,
    interactive: false,
    backgroundColor: "none",
    borderColor: "none",
    borderWidth: "0px",
    borderRadius: "none",
    boxShadow: "none",
    color: "none",
    fontFamily: "none",
    fontSize: "none",
    fontWeight: "none",
    lineHeight: "normal",
    letterSpacing: "normal",
    paddingTop: "0px",
    paddingLeft: "0px",
    marginTop: "0px",
    gap: "normal",
    ...overrides
});

const colorObservation = (value: string, area: number): StyleObservation => ({
    value,
    property: "background",
    area,
    glyphs: 0
});

describe("toPayloadValues", () => {
    it("converts weights to shares of the whole category", () => {
        const result = toPayloadValues([weighted("#a", 75), weighted("#b", 25)], 10);

        expect(result[0]).toMatchObject({ value: "#a", share: 0.75 });
        expect(result[1]).toMatchObject({ value: "#b", share: 0.25 });
    });

    it("keeps shares relative to everything seen, not to the capped slice", () => {
        // Telling the model the survivor is 50% of everything is honest; re-normalising it to 1.0
        // would imply the tail we dropped never existed.
        const result = toPayloadValues([weighted("#a", 50), weighted("#b", 50)], 1);

        expect(result).toHaveLength(1);
        expect(result[0].share).toBe(0.5);
    });

    it("applies the cap", () => {
        const many = Array.from({ length: 100 }, (_, i) => weighted(`#${i}`, 100 - i));
        expect(toPayloadValues(many, 40)).toHaveLength(40);
    });

    it("survives an empty category without dividing by zero", () => {
        expect(toPayloadValues([], 10)).toEqual([]);
        expect(toPayloadValues([weighted("#a", 0)], 10)[0].share).toBe(0);
    });
});

describe("assessDarkMode", () => {
    // Dominant (highest-area) background is the near-white first entry.
    const lightPage = tallyColors([
        colorObservation("#ffffff", 100),
        colorObservation("#000000", 90)
    ]);

    it("reports not probed when the dark pass did not run", () => {
        expect(assessDarkMode(lightPage, undefined)).toEqual({ probed: false });
    });

    it("is a real dark variant when the page background flips light to dark", () => {
        const darkPage = tallyColors([
            colorObservation("#0f172a", 100),
            colorObservation("#f8fafc", 90)
        ]);

        expect(assessDarkMode(lightPage, darkPage)).toMatchObject({
            probed: true,
            hasDarkVariant: true
        });
    });

    it("is a single scheme for a dark-only site whose colours churn but background stays dark", () => {
        // The normal crawl and the dark pass both have a near-black dominant background — no flip,
        // even though the colour set moved around. This is the questdb.com case.
        const darkPage = tallyColors([
            colorObservation("#0f172a", 100),
            colorObservation("#1e293b", 90)
        ]);
        const darkPageChurned = tallyColors([
            colorObservation("#111827", 100),
            colorObservation("#334155", 90)
        ]);

        expect(assessDarkMode(darkPage, darkPageChurned)).toMatchObject({
            probed: true,
            hasDarkVariant: false,
            singleScheme: true
        });
    });

    it("is a single scheme for a light-only site (background stays light)", () => {
        const lightPageChurned = tallyColors([
            colorObservation("#f8fafc", 100),
            colorObservation("#e2e8f0", 90)
        ]);

        expect(assessDarkMode(lightPage, lightPageChurned)).toMatchObject({
            hasDarkVariant: false,
            singleScheme: true
        });
    });

    it("honours a custom threshold on the background drop", () => {
        const darkPage = tallyColors([colorObservation("#0f172a", 100)]);

        // A full light->dark flip clears the default threshold but not an impossibly strict one.
        expect(assessDarkMode(lightPage, darkPage)).toMatchObject({ hasDarkVariant: true });
        expect(assessDarkMode(lightPage, darkPage, 1.5)).toMatchObject({ singleScheme: true });
    });
});

describe("planScreenshots", () => {
    it("plans exactly the cap for a full five-page crawl", () => {
        const plan = planScreenshots({
            entryUrl: "https://northbeam.io/",
            interiorUrls: ["/a", "/b", "/c", "/d"]
        });

        expect(plan).toHaveLength(PAYLOAD_CAPS.screenshots);
        expect(plan.filter(entry => entry.kind === "homepage-crop")).toHaveLength(3);
        expect(plan.filter(entry => entry.kind === "mobile")).toHaveLength(1);
        expect(plan.filter(entry => entry.kind === "interior")).toHaveLength(4);
    });

    it("drops interior pages first when the budget is tight", () => {
        const plan = planScreenshots({
            entryUrl: "https://northbeam.io/",
            interiorUrls: ["/a", "/b", "/c", "/d"],
            cap: 5
        });

        expect(plan).toHaveLength(5);
        expect(plan.filter(entry => entry.kind === "interior")).toHaveLength(1);
    });

    it("still plans the homepage crops when nothing else was crawled", () => {
        const plan = planScreenshots({ entryUrl: "https://northbeam.io/", interiorUrls: [] });

        expect(plan).toHaveLength(4);
    });
});

describe("buildModelPayload", () => {
    const build = () => {
        const observations = toObservations([
            element({ backgroundColor: "#ffffff", area: 900_000 }),
            element({ backgroundColor: "#1f6feb", area: 40_000 }),
            // A near-identical variant, which quantisation should absorb.
            element({ backgroundColor: "#1f6fea", area: 100 }),
            element({ color: "#0b1220", glyphs: 500, fontSize: "16px", fontFamily: "Inter" }),
            element({ paddingTop: "24px", area: 5000 }),
            element({ borderRadius: "6px", area: 5000 }),
            element({ boxShadow: "0 1px 2px rgba(0,0,0,.1)", area: 5000 })
        ]);

        return buildModelPayload({
            entryUrl: "https://northbeam.io/",
            sampledUrls: ["https://northbeam.io/", "https://northbeam.io/pricing"],
            viewportWidth: 1440,
            observations,
            fonts: [{ url: "https://northbeam.io/inter.woff2", family: "Inter", weight: "400" }]
        });
    };

    it("records what was actually sampled", () => {
        const payload = build();

        expect(payload.schemaVersion).toBe(1);
        expect(payload.source).toEqual({
            entryUrl: "https://northbeam.io/",
            sampledUrls: ["https://northbeam.io/", "https://northbeam.io/pricing"],
            viewportWidth: 1440
        });
    });

    it("quantises before capping, so the colours offered are genuinely distinct", () => {
        const payload = build();
        const values = payload.colors.map(entry => entry.value);

        expect(values).toContain("#1f6feb");
        expect(values).not.toContain("#1f6fea");
    });

    it("ranks the heaviest colour first", () => {
        expect(build().colors[0].value).toBe("#ffffff");
    });

    it("carries every category the model needs to name tokens", () => {
        const payload = build();

        expect(payload.fontSizes[0].value).toBe("16px");
        expect(payload.spacing[0].value).toBe("24px");
        expect(payload.radii[0].value).toBe("6px");
        expect(payload.shadows[0].value).toBe("0 1px 2px rgba(0,0,0,.1)");
        expect(payload.fontFamilies[0].value).toBe("Inter");
    });

    it("passes through the fonts the network log proved were loaded", () => {
        expect(build().fonts).toEqual([
            { url: "https://northbeam.io/inter.woff2", family: "Inter", weight: "400" }
        ]);
    });

    it("plans screenshots for the entry page plus each interior page", () => {
        const payload = build();

        expect(payload.screenshots.filter(entry => entry.kind === "interior")).toHaveLength(1);
        expect(payload.screenshots.at(-1)?.url).toBe("https://northbeam.io/pricing");
    });

    it("reports dark mode as not probed when no dark pass was supplied", () => {
        expect(build().darkMode).toEqual({ probed: false });
    });

    it("assesses dark mode when the probe ran", () => {
        const observations = toObservations([element({ backgroundColor: "#ffffff", area: 1000 })]);
        const darkColors = toObservations([
            element({ backgroundColor: "#0f172a", area: 1000 })
        ]).colors;

        const payload = buildModelPayload({
            entryUrl: "https://northbeam.io/",
            sampledUrls: ["https://northbeam.io/"],
            viewportWidth: 1440,
            observations,
            darkColors,
            fonts: []
        });

        expect(payload.darkMode).toMatchObject({ probed: true, hasDarkVariant: true });
    });

    it("holds every cap, so a heavy site cannot blow the model budget", () => {
        const many = Array.from({ length: 300 }, (_, i) =>
            element({
                // Spread far enough apart that quantisation will not merge them.
                backgroundColor: `rgb(${i}, ${(i * 7) % 256}, ${(i * 13) % 256})`,
                area: 1000 - i,
                paddingTop: `${i}px`,
                borderRadius: `${i}px`,
                boxShadow: `0 ${i}px 0 #000`,
                fontSize: `${i}px`,
                glyphs: 10
            })
        );

        const payload = buildModelPayload({
            entryUrl: "https://northbeam.io/",
            sampledUrls: ["https://northbeam.io/"],
            viewportWidth: 1440,
            observations: toObservations(many),
            fonts: []
        });

        expect(payload.colors.length).toBeLessThanOrEqual(PAYLOAD_CAPS.colors);
        expect(payload.fontSizes.length).toBeLessThanOrEqual(PAYLOAD_CAPS.fontSizes);
        expect(payload.spacing.length).toBeLessThanOrEqual(PAYLOAD_CAPS.spacing);
        expect(payload.radii.length).toBeLessThanOrEqual(PAYLOAD_CAPS.radii);
        expect(payload.shadows.length).toBeLessThanOrEqual(PAYLOAD_CAPS.shadows);
        expect(payload.screenshots.length).toBeLessThanOrEqual(PAYLOAD_CAPS.screenshots);
    });
});
