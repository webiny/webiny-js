import { parseLength } from "@webiny/theme-common";
import type { SampledElement } from "./samplePage.js";

/**
 * Per-role measurements taken deterministically from the crawl.
 *
 * Used after the model has chosen the scales, to point a few semantic roles at the ramp step the site
 * actually uses rather than at the seeded default. This is counting, deliberately kept outside the
 * model's judgement (and off the model payload) — the model decides the radius/border *scale*, this
 * decides which step on that scale a control or a card sits at.
 */
export interface RoleSignal {
    /** The measured CSS length, e.g. "8px". */
    value: string;
    /** How many sampled elements carried this value — a low count is low confidence. */
    samples: number;
}

export interface RoleSignals {
    /** Border-radius measured on interactive controls (buttons, inputs) → `radius.control`. */
    radiusControl?: RoleSignal;
    /** Border-radius measured on card/panel containers → `radius.container`. */
    radiusContainer?: RoleSignal;
    /** Border width measured on interactive controls → `border.control`. */
    borderControl?: RoleSignal;
}

/**
 * A length that parses and is non-negative. `0px` counts: a square corner is a real radius choice, not
 * a missing measurement, so a site with square controls should pull `radius.control` down to `none`.
 */
const isLength = (raw: string | undefined): boolean => !!raw && parseLength(raw.trim()) !== null;

/** A length that parses and is strictly positive — a real border, not "no border" (`0px`). */
const isPositiveLength = (raw: string | undefined): boolean => {
    const parsed = raw ? parseLength(raw.trim()) : null;
    return !!parsed && parsed.value > 0;
};

/** `transparent`, or an `rgb(a)` whose alpha is zero — i.e. nothing is actually painted. */
const isTransparent = (value: string): boolean =>
    value === "transparent" || /rgba?\([^)]*[,/]\s*0(\.0+)?\s*\)$/.test(value);

/** A background that actually paints — the mark of a card/panel rather than a bare layout wrapper. */
const paints = (value: string | undefined): boolean => {
    if (!value) {
        return false;
    }
    const v = value.trim().toLowerCase();
    return v !== "" && v !== "none" && !isTransparent(v);
};

/** A box-shadow that actually renders (`none` is the computed value when there is no shadow). */
const hasShadow = (value: string | undefined): boolean =>
    !!value && value.trim().toLowerCase() !== "none";

/**
 * A card/panel: a non-interactive box that reads as a distinct surface (paints a background, casts a
 * shadow, or draws a border) *and* pads its content. Full-bleed layout bands rarely pad and rarely
 * round, so this keeps their (usually square) corners out of the container-radius vote.
 */
const isContainerLike = (element: SampledElement): boolean =>
    !element.interactive &&
    (paints(element.backgroundColor) ||
        hasShadow(element.boxShadow) ||
        isPositiveLength(element.borderWidth)) &&
    (isPositiveLength(element.paddingTop) || isPositiveLength(element.paddingLeft));

/**
 * Occurrence-weighted vote over a single measurement. A design applies one radius across many
 * controls and one across many cards, so "the value most elements share" is a far more robust
 * representative than the largest element's value (which a single hero band would otherwise win).
 */
class ValueTally {
    private readonly counts = new Map<string, { samples: number; area: number }>();

    add(value: string, area: number): void {
        const key = value.trim();
        const entry = this.counts.get(key) ?? { samples: 0, area: 0 };
        entry.samples += 1;
        entry.area += area;
        this.counts.set(key, entry);
    }

    best(): RoleSignal | undefined {
        let bestKey: string | undefined;
        let bestSamples = -1;
        let bestArea = -1;
        for (const [key, entry] of this.counts) {
            const wins =
                entry.samples > bestSamples ||
                (entry.samples === bestSamples && entry.area > bestArea);
            if (wins) {
                bestKey = key;
                bestSamples = entry.samples;
                bestArea = entry.area;
            }
        }
        return bestKey === undefined ? undefined : { value: bestKey, samples: bestSamples };
    }
}

/**
 * Classifies the sampled elements and returns the representative radius/border measurement per role.
 * A role is absent when nothing matched, in which case the seeded default stands.
 */
export const extractRoleSignals = (elements: SampledElement[]): RoleSignals => {
    const radiusControl = new ValueTally();
    const radiusContainer = new ValueTally();
    const borderControl = new ValueTally();

    for (const element of elements) {
        if (element.interactive) {
            if (isLength(element.borderRadius)) {
                radiusControl.add(element.borderRadius, element.area);
            }
            if (isPositiveLength(element.borderWidth)) {
                borderControl.add(element.borderWidth, element.area);
            }
        } else if (isContainerLike(element) && isLength(element.borderRadius)) {
            radiusContainer.add(element.borderRadius, element.area);
        }
    }

    const signals: RoleSignals = {};
    const control = radiusControl.best();
    if (control) {
        signals.radiusControl = control;
    }
    const container = radiusContainer.best();
    if (container) {
        signals.radiusContainer = container;
    }
    const border = borderControl.best();
    if (border) {
        signals.borderControl = border;
    }
    return signals;
};
