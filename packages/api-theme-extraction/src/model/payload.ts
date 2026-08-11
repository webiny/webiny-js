import { parseColor, relativeLuminance } from "@webiny/theme-common";
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
          /** How much lighter the normal crawl's dominant background is than the dark pass's (0–1). */
          backgroundDrop: number;
          /** The site ships a real dark variant, so both were extracted. */
          hasDarkVariant: true;
      }
    | {
          probed: true;
          backgroundDrop: number;
          hasDarkVariant: false;
          /** The site has a single scheme; no dark palette is generated. */
          singleScheme: true;
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

/** The relative luminance (0–1) of the most-covering background colour, or undefined if none parses. */
export const dominantBackgroundLuminance = (values: WeightedValue[]): number | undefined => {
    let best: WeightedValue | undefined;
    for (const value of values) {
        if (!value.properties.includes("background")) {
            continue;
        }
        if (!best || value.weight > best.weight) {
            best = value;
        }
    }

    if (!best) {
        return undefined;
    }
    const rgba = parseColor(best.value);
    return rgba ? relativeLuminance(rgba) : undefined;
};

/**
 * How much lighter the normal page background must be than the dark-emulated one before we call it a
 * real dark variant. A genuine light↔dark theme swaps a near-white page for a near-black one, a drop
 * approaching 1; content churn on a single-scheme page leaves the background where it was.
 */
export const DARK_BACKGROUND_DROP_THRESHOLD = 0.25;

/**
 * Whether the site ships a real dark variant — decided by whether its dominant page background flips
 * from light to dark between the normal crawl and the dark-emulated one, NOT by how much the colour
 * set churned. A dark-only (or light-only) site keeps its background lightness, so it reads as a
 * single scheme; only a site that actually presents a light page and a dark page counts as dual.
 */
export const assessDarkMode = (
    light: WeightedValue[],
    dark: WeightedValue[] | undefined,
    threshold = DARK_BACKGROUND_DROP_THRESHOLD
): DarkModeOutcome => {
    if (!dark) {
        return { probed: false };
    }

    const lightLuminance = dominantBackgroundLuminance(light);
    const darkLuminance = dominantBackgroundLuminance(dark);
    const backgroundDrop =
        lightLuminance !== undefined && darkLuminance !== undefined
            ? round4(lightLuminance - darkLuminance)
            : 0;

    if (backgroundDrop >= threshold) {
        return { probed: true, backgroundDrop, hasDarkVariant: true };
    }

    return { probed: true, backgroundDrop, hasDarkVariant: false, singleScheme: true };
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
