import { RADIUS_STEPS, SHADOW_STEPS } from "~/canonical/ramps.js";
import { CANONICAL_TYPOGRAPHY_ROLES } from "~/canonical/typographyRoles.js";
import { toAlias } from "~/dtcg/guards.js";
import {
    META_EXTENSION,
    MODES_EXTENSION,
    type DesignToken,
    type ShadowLayerValue,
    type TokenDocument,
    type TokenGroup,
    type TokenValue
} from "~/dtcg/types.js";
import { DEFAULT_RAMP_CONFIG, generateRamp } from "~/fluid/ramp.js";
import { DEFAULT_FONTS, DEFAULT_PALETTE } from "./palette.js";

/**
 * The default theme. Every canonical slot is seeded from it on creation, so a theme is never
 * partially filled and publishing is never blocked by a slot nobody touched.
 */

/** Builds a leaf token, attaching a dark override only when one is given. */
const token = (value: TokenValue, dark?: TokenValue): DesignToken => {
    if (dark === undefined) {
        return { $value: value };
    }
    return { $value: value, $extensions: { [MODES_EXTENSION]: { dark } } };
};

/** A canonical slot pointing at a primitive, optionally at a different primitive in dark. */
const slot = (lightKey: string, darkKey?: string): DesignToken => {
    return token(
        toAlias(`color.brand.${lightKey}`),
        darkKey === undefined ? undefined : toAlias(`color.brand.${darkKey}`)
    );
};

const brandPalette = (): TokenGroup => {
    const group: TokenGroup = {};

    for (const [key, value] of Object.entries(DEFAULT_PALETTE)) {
        group[key] = {
            $value: value,
            $extensions: { [META_EXTENSION]: { key, displayName: key } }
        } satisfies DesignToken;
    }

    return group;
};

const colorGroup = (): TokenGroup => ({
    $type: "color",
    brand: brandPalette(),

    surface: {
        page: slot("neutral-50", "neutral-900"),
        raised: slot("white", "neutral-800"),
        sunken: slot("neutral-100", "neutral-950"),
        overlay: slot("white", "neutral-800")
    },

    text: {
        primary: slot("neutral-900", "neutral-50"),
        secondary: slot("neutral-700", "neutral-300"),
        muted: slot("neutral-500", "neutral-400"),
        inverse: slot("white", "neutral-900"),
        link: slot("blue-700", "blue-400")
    },

    border: {
        default: slot("neutral-200", "neutral-700"),
        subtle: slot("neutral-100", "neutral-800"),
        strong: slot("neutral-500", "neutral-500"),
        focus: slot("blue-600", "blue-400")
    },

    action: {
        primary: {
            background: slot("blue-600", "blue-600"),
            foreground: slot("white", "white"),
            hover: slot("blue-700", "blue-500"),
            active: slot("blue-700", "blue-400")
        },
        secondary: {
            background: slot("neutral-100", "neutral-800"),
            foreground: slot("neutral-900", "neutral-50"),
            hover: slot("neutral-200", "neutral-700"),
            active: slot("neutral-300", "neutral-600")
        }
    },

    feedback: {
        info: {
            background: slot("blue-50", "blue-950"),
            foreground: slot("blue-700", "blue-300")
        },
        success: {
            background: slot("green-50", "green-950"),
            foreground: slot("green-700", "green-300")
        },
        warning: {
            background: slot("amber-50", "amber-950"),
            foreground: slot("amber-700", "amber-300")
        },
        danger: {
            background: slot("red-50", "red-950"),
            foreground: slot("red-700", "red-300")
        }
    }
});

const fontGroup = (): TokenGroup => ({
    $type: "fontFamily",
    sans: {
        $value: DEFAULT_FONTS.sans.family,
        $extensions: { [META_EXTENSION]: { key: "sans", displayName: "Sans" } }
    },
    mono: {
        $value: DEFAULT_FONTS.mono.family,
        $extensions: { [META_EXTENSION]: { key: "mono", displayName: "Mono" } }
    }
});

/** Builds a fluid-capable ramp group from the generator, so the seed and the editor agree. */
const fluidRampGroup = (rampId: "space" | "text"): TokenGroup => {
    const group: TokenGroup = { $type: "dimension" };

    for (const step of generateRamp(rampId, DEFAULT_RAMP_CONFIG[rampId])) {
        group[step.step] = {
            $value: step.min,
            $extensions: {
                [META_EXTENSION]: {
                    fluid: { min: step.min, max: step.max, enabled: step.enabled }
                }
            }
        } satisfies DesignToken;
    }

    return group;
};

const RADIUS_VALUES: Readonly<Record<(typeof RADIUS_STEPS)[number], string>> = {
    none: "0rem",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.75rem",
    full: "9999px"
};

const radiusGroup = (): TokenGroup => {
    const group: TokenGroup = { $type: "dimension" };
    for (const step of RADIUS_STEPS) {
        group[step] = { $value: RADIUS_VALUES[step] } satisfies DesignToken;
    }
    return group;
};

const shadowLayer = (
    offsetY: string,
    blur: string,
    spread: string,
    color: string
): ShadowLayerValue => ({ color, offsetX: "0rem", offsetY, blur, spread });

/** `none` is a fully transparent layer rather than a missing value, so the variable always exists. */
const SHADOW_VALUES: Readonly<Record<(typeof SHADOW_STEPS)[number], ShadowLayerValue>> = {
    none: shadowLayer("0rem", "0rem", "0rem", "rgba(0, 0, 0, 0)"),
    sm: shadowLayer("0.0625rem", "0.125rem", "0rem", "rgba(15, 23, 42, 0.08)"),
    md: shadowLayer("0.25rem", "0.5rem", "-0.0625rem", "rgba(15, 23, 42, 0.10)"),
    lg: shadowLayer("0.625rem", "1rem", "-0.1875rem", "rgba(15, 23, 42, 0.12)"),
    xl: shadowLayer("1.25rem", "1.875rem", "-0.375rem", "rgba(15, 23, 42, 0.16)")
};

const SHADOW_DARK_ALPHA: Readonly<Record<(typeof SHADOW_STEPS)[number], string>> = {
    none: "rgba(0, 0, 0, 0)",
    sm: "rgba(0, 0, 0, 0.32)",
    md: "rgba(0, 0, 0, 0.40)",
    lg: "rgba(0, 0, 0, 0.48)",
    xl: "rgba(0, 0, 0, 0.56)"
};

const shadowGroup = (): TokenGroup => {
    const group: TokenGroup = { $type: "shadow" };

    for (const step of SHADOW_STEPS) {
        const light = SHADOW_VALUES[step];
        group[step] = token(light, { ...light, color: SHADOW_DARK_ALPHA[step] });
    }

    return group;
};

interface RoleDefaults {
    size: string;
    weight: number;
    lineHeight: number;
    letterSpacing: string;
    family?: "sans" | "mono";
}

const ROLE_DEFAULTS: Readonly<Record<string, RoleDefaults>> = {
    "type.body": { size: "md", weight: 400, lineHeight: 1.6, letterSpacing: "0rem" },
    "type.bodySmall": { size: "sm", weight: 400, lineHeight: 1.55, letterSpacing: "0rem" },
    "type.caption": { size: "xs", weight: 400, lineHeight: 1.45, letterSpacing: "0.005rem" },
    "type.lead": { size: "lg", weight: 400, lineHeight: 1.5, letterSpacing: "0rem" },
    "type.code": {
        size: "sm",
        weight: 400,
        lineHeight: 1.6,
        letterSpacing: "0rem",
        family: "mono"
    },
    "type.heading.1": { size: "3xl", weight: 700, lineHeight: 1.1, letterSpacing: "-0.02rem" },
    "type.heading.2": { size: "2xl", weight: 700, lineHeight: 1.15, letterSpacing: "-0.015rem" },
    "type.heading.3": { size: "xl", weight: 600, lineHeight: 1.2, letterSpacing: "-0.01rem" },
    "type.heading.4": { size: "lg", weight: 600, lineHeight: 1.25, letterSpacing: "-0.005rem" },
    "type.heading.5": { size: "md", weight: 600, lineHeight: 1.3, letterSpacing: "0rem" },
    "type.heading.6": { size: "sm", weight: 600, lineHeight: 1.35, letterSpacing: "0rem" }
};

const typographyGroup = (): TokenGroup => {
    const group: TokenGroup = { $type: "typography", heading: {} };

    for (const role of CANONICAL_TYPOGRAPHY_ROLES) {
        const defaults = ROLE_DEFAULTS[role.path];
        if (!defaults) {
            throw new Error(`Missing default typography values for canonical role "${role.path}".`);
        }

        const value: DesignToken = {
            $value: {
                fontFamily: toAlias(`font.${defaults.family ?? "sans"}`),
                fontSize: toAlias(`text.${defaults.size}`),
                fontWeight: defaults.weight,
                lineHeight: defaults.lineHeight,
                letterSpacing: defaults.letterSpacing
            }
        };

        const [, ...rest] = role.path.split(".");
        if (rest.length === 1) {
            group[rest[0]] = value;
        } else {
            (group.heading as TokenGroup)[rest[1]] = value;
        }
    }

    return group;
};

/**
 * Returns a fresh copy of the default token document. Callers mutate the result, so this must not
 * hand out a shared object.
 */
export const createDefaultThemeDocument = (): TokenDocument => ({
    color: colorGroup(),
    font: fontGroup(),
    text: fluidRampGroup("text"),
    space: fluidRampGroup("space"),
    radius: radiusGroup(),
    shadow: shadowGroup(),
    type: typographyGroup()
});
