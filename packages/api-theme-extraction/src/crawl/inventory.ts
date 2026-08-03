import { parseColor, type Rgba } from "@webiny/theme-common";

/**
 * Frequency counting and palette quantisation — see the design brief, section 10.3.
 *
 * This is deliberately outside the model. Keeping the counting deterministic makes cost predictable
 * and results repeatable: the same page always produces the same inventory, so a surprising theme
 * can be traced to the numbers rather than to a sampling temperature.
 */

export type StyleProperty = "background" | "border" | "text";

export interface StyleObservation {
    value: string;
    property: StyleProperty;
    /** Rendered area in px². Weights background and border observations. */
    area: number;
    /** Characters of text directly inside the element. Weights text observations. */
    glyphs: number;
}

export interface WeightedValue {
    value: string;
    weight: number;
    occurrences: number;
    /** Which property classes this value was seen on, so the model knows what role it plays. */
    properties: StyleProperty[];
}

/**
 * Raw counts mislead badly: a colour on two hundred small icons outranks the hero background. So
 * background and border observations are weighted by the area they actually cover, and text
 * observations by how many characters are set in them.
 */
export const weightOf = (observation: StyleObservation): number => {
    if (observation.property === "text") {
        return Math.max(0, observation.glyphs);
    }
    return Math.max(0, observation.area);
};

const formatChannel = (value: number): string => {
    return Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, "0");
};

/**
 * Reduces a colour to one canonical spelling, so `#FFF`, `#ffffff` and `rgb(255,255,255)` tally as
 * one value instead of three. Translucent colours keep their alpha, because a scrim at 50% is not
 * the same token as the same colour at full strength.
 */
export const normaliseColor = (raw: string): string | null => {
    const parsed = parseColor(raw);
    if (!parsed) {
        return null;
    }

    // Fully transparent tells us nothing about the palette.
    if (parsed.a === 0) {
        return null;
    }

    const hex = `#${formatChannel(parsed.r)}${formatChannel(parsed.g)}${formatChannel(parsed.b)}`;

    return parsed.a >= 1 ? hex : `${hex}${formatChannel(parsed.a * 255)}`;
};

/** Squared RGB distance. Squared because we only ever compare it against a threshold. */
const distanceSquared = (a: Rgba, b: Rgba): number => {
    return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
};

/**
 * Default merge radius, in RGB distance. Chosen to absorb anti-aliasing and compression artefacts
 * — the near-identical variants a screenshot-derived palette is full of — without merging two greys
 * a designer picked deliberately.
 */
export const DEFAULT_QUANTISE_DISTANCE = 8;

/**
 * Tallies observations into weighted values, heaviest first.
 *
 * Ties break on the value itself so the output is stable: an unstable order would make two runs of
 * the same page produce different model payloads.
 */
export const tally = (observations: StyleObservation[]): WeightedValue[] => {
    const totals = new Map<string, WeightedValue>();

    for (const observation of observations) {
        const weight = weightOf(observation);
        if (weight <= 0) {
            continue;
        }

        const existing = totals.get(observation.value);

        if (existing) {
            existing.weight += weight;
            existing.occurrences += 1;
            if (!existing.properties.includes(observation.property)) {
                existing.properties.push(observation.property);
            }
        } else {
            totals.set(observation.value, {
                value: observation.value,
                weight,
                occurrences: 1,
                properties: [observation.property]
            });
        }
    }

    return [...totals.values()].sort(
        (a, b) => b.weight - a.weight || a.value.localeCompare(b.value)
    );
};

/** Tallies colour observations, normalising each value first so spellings do not fragment counts. */
export const tallyColors = (observations: StyleObservation[]): WeightedValue[] => {
    const normalised = observations
        .map(observation => {
            const value = normaliseColor(observation.value);
            return value ? { ...observation, value } : null;
        })
        .filter((observation): observation is StyleObservation => observation !== null);

    return tally(normalised);
};

/**
 * Merges near-identical colours into their heaviest representative.
 *
 * Input must already be sorted heaviest-first — `tallyColors` guarantees that — because the
 * survivor of a merge is whichever variant carries more of the page, and that is the one a designer
 * would recognise.
 */
export const quantiseColors = (
    values: WeightedValue[],
    maxDistance = DEFAULT_QUANTISE_DISTANCE
): WeightedValue[] => {
    const threshold = maxDistance ** 2;
    const survivors: Array<{ entry: WeightedValue; rgba: Rgba }> = [];

    for (const value of values) {
        const rgba = parseColor(value.value);
        if (!rgba) {
            continue;
        }

        const near = survivors.find(survivor => {
            // Only merge colours of comparable opacity: a solid and a translucent version of the
            // same hue play different roles.
            if (Math.abs(survivor.rgba.a - rgba.a) > 0.05) {
                return false;
            }
            return distanceSquared(survivor.rgba, rgba) <= threshold;
        });

        if (near) {
            near.entry.weight += value.weight;
            near.entry.occurrences += value.occurrences;
            for (const property of value.properties) {
                if (!near.entry.properties.includes(property)) {
                    near.entry.properties.push(property);
                }
            }
            continue;
        }

        survivors.push({ entry: { ...value, properties: [...value.properties] }, rgba });
    }

    // Merging shifts weights, so the order has to be re-established.
    return survivors
        .map(survivor => survivor.entry)
        .sort((a, b) => b.weight - a.weight || a.value.localeCompare(b.value));
};

/** Lengths are compared numerically, so `16px` and `16.0px` do not tally separately. */
export const normaliseLength = (raw: string, rootFontSize = 16): string | null => {
    const match = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(raw.trim());
    if (!match) {
        return null;
    }

    const value = Number.parseFloat(match[1]);
    if (!Number.isFinite(value)) {
        return null;
    }

    const px = match[2] === "px" ? value : value * rootFontSize;

    // Sub-pixel differences are rendering noise, not design intent.
    return `${Math.round(px * 2) / 2}px`;
};

export const tallyLengths = (observations: StyleObservation[]): WeightedValue[] => {
    const normalised = observations
        .map(observation => {
            const value = normaliseLength(observation.value);
            return value ? { ...observation, value } : null;
        })
        .filter((observation): observation is StyleObservation => observation !== null);

    return tally(normalised);
};

export const topN = <T>(values: T[], limit: number): T[] => values.slice(0, Math.max(0, limit));
