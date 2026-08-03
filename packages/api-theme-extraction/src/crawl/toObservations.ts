import type { StyleObservation } from "./inventory.js";
import type { SampledElement } from "./samplePage.js";

/**
 * Turns sampled elements into weighted observations.
 *
 * The property class chosen here decides how each value is weighted downstream — area for
 * background and border, glyph count for text — so this mapping is where the brief's weighting rule
 * actually takes effect.
 */

/** Values that carry no design intent and would otherwise dominate the tallies. */
const MEANINGLESS = new Set(["", "none", "auto", "normal", "inherit", "initial", "unset", "0px"]);

const isMeaningful = (value: string | undefined): value is string => {
    return typeof value === "string" && !MEANINGLESS.has(value.trim().toLowerCase());
};

export interface Observations {
    colors: StyleObservation[];
    fontSizes: StyleObservation[];
    spacing: StyleObservation[];
    radii: StyleObservation[];
    shadows: StyleObservation[];
    fontFamilies: StyleObservation[];
    fontWeights: StyleObservation[];
    lineHeights: StyleObservation[];
}

const empty = (): Observations => ({
    colors: [],
    fontSizes: [],
    spacing: [],
    radii: [],
    shadows: [],
    fontFamilies: [],
    fontWeights: [],
    lineHeights: []
});

export const toObservations = (elements: SampledElement[]): Observations => {
    const result = empty();

    for (const element of elements) {
        const { area, glyphs } = element;

        // Backgrounds and borders are judged by how much of the page they cover.
        if (isMeaningful(element.backgroundColor)) {
            result.colors.push({
                value: element.backgroundColor,
                property: "background",
                area,
                glyphs
            });
        }

        // A border colour only counts if there is actually a border drawn.
        if (isMeaningful(element.borderColor) && isMeaningful(element.borderWidth)) {
            result.colors.push({ value: element.borderColor, property: "border", area, glyphs });
        }

        // Text colour is judged by how many characters are set in it.
        if (isMeaningful(element.color) && glyphs > 0) {
            result.colors.push({ value: element.color, property: "text", area, glyphs });
        }

        if (isMeaningful(element.fontSize) && glyphs > 0) {
            result.fontSizes.push({ value: element.fontSize, property: "text", area, glyphs });
        }

        if (isMeaningful(element.fontFamily) && glyphs > 0) {
            result.fontFamilies.push({ value: element.fontFamily, property: "text", area, glyphs });
        }

        if (isMeaningful(element.fontWeight) && glyphs > 0) {
            result.fontWeights.push({ value: element.fontWeight, property: "text", area, glyphs });
        }

        if (isMeaningful(element.lineHeight) && glyphs > 0) {
            result.lineHeights.push({ value: element.lineHeight, property: "text", area, glyphs });
        }

        // Spacing is a property of the box, so it is area-weighted like a background.
        for (const value of [
            element.paddingTop,
            element.paddingLeft,
            element.marginTop,
            element.gap
        ]) {
            if (isMeaningful(value)) {
                result.spacing.push({ value, property: "background", area, glyphs });
            }
        }

        if (isMeaningful(element.borderRadius)) {
            result.radii.push({
                value: element.borderRadius,
                property: "background",
                area,
                glyphs
            });
        }

        if (isMeaningful(element.boxShadow)) {
            result.shadows.push({ value: element.boxShadow, property: "background", area, glyphs });
        }
    }

    return result;
};

/** Merges the observations from several pages, so the inventory spans the whole crawl. */
export const mergeObservations = (pages: Observations[]): Observations => {
    return pages.reduce<Observations>((merged, page) => {
        for (const key of Object.keys(merged) as Array<keyof Observations>) {
            merged[key].push(...page[key]);
        }
        return merged;
    }, empty());
};
