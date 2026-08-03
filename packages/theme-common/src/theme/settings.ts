import type { FluidViewportRange } from "~/dtcg/types.js";
import { DEFAULT_VIEWPORT_RANGE } from "~/fluid/clamp.js";
import { DEFAULT_RAMP_CONFIG, type RampGeneratorConfig } from "~/fluid/ramp.js";
import { DEFAULT_FONTS } from "~/defaults/palette.js";

/**
 * Editor-owned settings that sit beside the token tree. Base sizes, ratios and font metadata are
 * how the ramps were produced; the resolved values live in the token document, and artifacts are
 * generated from those. Nothing here is emitted as a token.
 */

export interface FontDefinition {
    /** Immutable key. Referenced from `font.*` tokens. */
    key: string;
    /** Google Fonts family name. Google Fonts only in v1. */
    family: string;
    /** Only the weights the theme actually uses are requested. */
    weights: number[];
    styles: string[];
    subsets: string[];
    display: string;
    /** Variable fonts are preferred; recorded so the loader can request the variable file. */
    variable: boolean;
}

export interface ThemeSettings {
    /**
     * One viewport range shared by every fluid token, so everything reaches its maximum together
     * and vertical rhythm does not drift.
     */
    viewport: FluidViewportRange;
    /** Generator state per fluid-capable ramp, retained so the editor can regenerate. */
    ramps: {
        space: RampGeneratorConfig;
        text: RampGeneratorConfig;
    };
    fonts: FontDefinition[];
}

export const createDefaultSettings = (): ThemeSettings => ({
    viewport: { ...DEFAULT_VIEWPORT_RANGE },
    ramps: {
        space: structuredClone(DEFAULT_RAMP_CONFIG.space),
        text: structuredClone(DEFAULT_RAMP_CONFIG.text)
    },
    fonts: [
        {
            ...DEFAULT_FONTS.sans,
            weights: [...DEFAULT_FONTS.sans.weights],
            styles: [...DEFAULT_FONTS.sans.styles],
            subsets: [...DEFAULT_FONTS.sans.subsets]
        },
        {
            ...DEFAULT_FONTS.mono,
            weights: [...DEFAULT_FONTS.mono.weights],
            styles: [...DEFAULT_FONTS.mono.styles],
            subsets: [...DEFAULT_FONTS.mono.subsets]
        }
    ]
});
