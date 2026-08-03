import type { FontResource } from "~/domain/abstractions.js";
import {
    quantiseColors,
    tally,
    tallyColors,
    tallyLengths,
    topN,
    type StyleProperty,
    type WeightedValue
} from "~/crawl/inventory.js";
import type { Observations } from "~/crawl/toObservations.js";

/**
 * Assembling what the model actually sees — see the design brief, section 10.5.
 *
 * The caps exist because the model is the expensive, non-deterministic part: everything we can
 * decide by counting has already been decided by the time this runs, and what is left is judgement
 * work — collapsing near-identical greys into steps, naming things, and spotting which colour is
 * genuinely the action colour rather than merely the most frequent one.
 *
 * The numbers below are reasoned from Lambda constraints rather than measured. The brief asks us to
 * validate them against real sites during implementation and report what we find; until that has
 * happened, treat them as starting points rather than settled.
 */
export const PAYLOAD_CAPS = {
    colors: 40,
    fontSizes: 20,
    spacing: 15,
    radii: 15,
    shadows: 15,
    fontFamilies: 6,
    fontWeights: 10,
    lineHeights: 10,
    screenshots: 8,
    /** Longest edge, in px. Larger buys the model no detail it can use. */
    screenshotLongestEdge: 1568
} as const;

export interface ModelPayloadValue {
    value: string;
    /**
     * Share of this category's total weight, 0–1.
     *
     * A share travels better than the raw weight it came from: absolute pixel areas depend on page
     * height and viewport, so they are not comparable between pages and mean little to a model. A
     * share says "this colour covers a fifth of what we looked at", which is the actual signal.
     */
    share: number;
    occurrences: number;
    properties: StyleProperty[];
}

export interface ScreenshotPlanEntry {
    label: string;
    kind: "homepage-crop" | "mobile" | "interior";
    url: string;
}

export type DarkModeOutcome =
    | { probed: false }
    | {
          probed: true;
          /** Fraction of the top light colours that changed under emulated dark mode. */
          changedShare: number;
          /** The site ships a real dark variant, so both were extracted. */
          hasDarkVariant: true;
      }
    | {
          probed: true;
          changedShare: number;
          hasDarkVariant: false;
          /** Dark will be generated from light and marked as derived rather than observed. */
          derived: true;
      };

export interface ModelPayload {
    schemaVersion: 1;
    source: {
        entryUrl: string;
        /** The URLs actually sampled, which may be fewer than planned. */
        sampledUrls: string[];
        viewportWidth: number;
    };
    colors: ModelPayloadValue[];
    fontSizes: ModelPayloadValue[];
    spacing: ModelPayloadValue[];
    radii: ModelPayloadValue[];
    shadows: ModelPayloadValue[];
    fontFamilies: ModelPayloadValue[];
    fontWeights: ModelPayloadValue[];
    lineHeights: ModelPayloadValue[];
    /** Fonts the network log proves were loaded, not merely declared in CSS. */
    fonts: FontResource[];
    screenshots: ScreenshotPlanEntry[];
    darkMode: DarkModeOutcome;
}

const round4 = (value: number): number => Math.round(value * 10000) / 10000;

/** Converts weights to shares and applies the cap. */
export const toPayloadValues = (values: WeightedValue[], cap: number): ModelPayloadValue[] => {
    // The share is of the whole category, not of the capped slice: telling the model a colour is 8%
    // of everything we saw is honest, whereas re-normalising the survivors to sum to 1 would imply
    // the tail did not exist.
    const total = values.reduce((sum, entry) => sum + entry.weight, 0);

    return topN(values, cap).map(entry => ({
        value: entry.value,
        share: total > 0 ? round4(entry.weight / total) : 0,
        occurrences: entry.occurrences,
        properties: [...entry.properties]
    }));
};

/**
 * What fraction of the top colours changed under emulated dark mode.
 *
 * Compared over the top slice rather than the whole tally: a page's long tail of one-off colours is
 * noisy and would dilute a genuine dark variant into looking like no change at all.
 */
export const darkModeChangedShare = (
    light: WeightedValue[],
    dark: WeightedValue[],
    sampleSize = 20
): number => {
    const lightTop = topN(light, sampleSize);
    if (lightTop.length === 0) {
        return 0;
    }

    const darkValues = new Set(topN(dark, sampleSize).map(entry => entry.value));
    const changed = lightTop.filter(entry => !darkValues.has(entry.value)).length;

    return round4(changed / lightTop.length);
};

/**
 * How much of the palette has to change before we believe the site really ships a dark variant.
 *
 * UNVALIDATED. Picked as a starting point: below this, what changed is more likely a media-query
 * tweak to one or two colours than a designed dark theme. Needs checking against real sites, and
 * the brief expects us to report what we find.
 */
export const DARK_MODE_CHANGE_THRESHOLD = 0.3;

export const assessDarkMode = (
    light: WeightedValue[],
    dark: WeightedValue[] | undefined,
    threshold = DARK_MODE_CHANGE_THRESHOLD
): DarkModeOutcome => {
    if (!dark) {
        return { probed: false };
    }

    const changedShare = darkModeChangedShare(light, dark);

    if (changedShare >= threshold) {
        return { probed: true, changedShare, hasDarkVariant: true };
    }

    return { probed: true, changedShare, hasDarkVariant: false, derived: true };
};

export interface PlanScreenshotsParams {
    entryUrl: string;
    /** Interior pages, in crawl order. */
    interiorUrls: string[];
    cap?: number;
}

/**
 * Chooses which screenshots to send.
 *
 * Three homepage crops, one mobile crop, then one per interior page — which comes to exactly the cap
 * for a full five-page crawl. Homepage crops come first because the entry page carries the most
 * design intent per pixel; interior pages are dropped from the end if the budget runs short.
 */
export const planScreenshots = ({
    entryUrl,
    interiorUrls,
    cap = PAYLOAD_CAPS.screenshots
}: PlanScreenshotsParams): ScreenshotPlanEntry[] => {
    const plan: ScreenshotPlanEntry[] = [
        { label: "Homepage, above the fold", kind: "homepage-crop", url: entryUrl },
        { label: "Homepage, mid page", kind: "homepage-crop", url: entryUrl },
        { label: "Homepage, footer", kind: "homepage-crop", url: entryUrl },
        { label: "Homepage on a phone", kind: "mobile", url: entryUrl }
    ];

    for (const url of interiorUrls) {
        plan.push({ label: `Interior page: ${url}`, kind: "interior", url });
    }

    return topN(plan, cap);
};

export interface BuildModelPayloadParams {
    entryUrl: string;
    sampledUrls: string[];
    viewportWidth: number;
    observations: Observations;
    /** Colour observations from the dark-mode probe of the entry page, when it ran. */
    darkColors?: Observations["colors"];
    fonts: FontResource[];
}

export const buildModelPayload = ({
    entryUrl,
    sampledUrls,
    viewportWidth,
    observations,
    darkColors,
    fonts
}: BuildModelPayloadParams): ModelPayload => {
    // Quantise before capping, so the top 40 are 40 distinct colours rather than 40 near-identical
    // variants of the same six.
    const colors = quantiseColors(tallyColors(observations.colors));
    const dark = darkColors ? quantiseColors(tallyColors(darkColors)) : undefined;

    const interiorUrls = sampledUrls.filter(url => url !== entryUrl);

    return {
        schemaVersion: 1,
        source: { entryUrl, sampledUrls, viewportWidth },
        colors: toPayloadValues(colors, PAYLOAD_CAPS.colors),
        fontSizes: toPayloadValues(tallyLengths(observations.fontSizes), PAYLOAD_CAPS.fontSizes),
        spacing: toPayloadValues(tallyLengths(observations.spacing), PAYLOAD_CAPS.spacing),
        radii: toPayloadValues(tallyLengths(observations.radii), PAYLOAD_CAPS.radii),
        // Shadows and families are compound strings, not lengths or colours, so they are tallied
        // verbatim — normalising them would mean parsing a grammar the model reads better than we do.
        shadows: toPayloadValues(tally(observations.shadows), PAYLOAD_CAPS.shadows),
        fontFamilies: toPayloadValues(tally(observations.fontFamilies), PAYLOAD_CAPS.fontFamilies),
        fontWeights: toPayloadValues(tally(observations.fontWeights), PAYLOAD_CAPS.fontWeights),
        lineHeights: toPayloadValues(tally(observations.lineHeights), PAYLOAD_CAPS.lineHeights),
        fonts,
        screenshots: planScreenshots({ entryUrl, interiorUrls }),
        darkMode: assessDarkMode(colors, dark)
    };
};
