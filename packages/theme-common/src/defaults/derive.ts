/**
 * Minimal sRGB colour maths for derived defaults — see the change brief, C4.
 *
 * Sixty-seven semantic slots is too many to author by hand and too many for the extraction agent to
 * determine. A small set is determined (palette, actions, surfaces) and the rest are derived by rule.
 * These are the primitives those rules are built from. Pure and unit-tested; both the default-theme
 * seed and extraction completion build on them so a generated theme and a blank one derive alike.
 *
 * A derived value becomes a normal, editable value once written — there is no live formula and no
 * ongoing relationship, so nothing here runs after seeding.
 */

interface Rgb {
    r: number;
    g: number;
    b: number;
}

const clampChannel = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

/** Parses `#rrggbb` (or `#rgb`). Returns null for anything else, so callers can fall back safely. */
export const parseHex = (hex: string): Rgb | null => {
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!match) {
        return null;
    }
    const body =
        match[1].length === 3
            ? match[1]
                  .split("")
                  .map(char => char + char)
                  .join("")
            : match[1];
    const int = Number.parseInt(body, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const toHex = ({ r, g, b }: Rgb): string =>
    `#${[r, g, b].map(channel => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const mix = (a: Rgb, b: Rgb, t: number): Rgb => ({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
});

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/** Mixes `amount` (0–1) of black in. A non-hex input is returned unchanged. */
export const darken = (hex: string, amount: number): string => {
    const rgb = parseHex(hex);
    return rgb ? toHex(mix(rgb, BLACK, amount)) : hex;
};

/** Mixes `amount` (0–1) of white in. A non-hex input is returned unchanged. */
export const lighten = (hex: string, amount: number): string => {
    const rgb = parseHex(hex);
    return rgb ? toHex(mix(rgb, WHITE, amount)) : hex;
};

/** An `rgba()` string at the given alpha, for scrims and tints. Non-hex input is returned unchanged. */
export const withAlpha = (hex: string, alpha: number): string => {
    const rgb = parseHex(hex);
    return rgb
        ? `rgba(${clampChannel(rgb.r)}, ${clampChannel(rgb.g)}, ${clampChannel(rgb.b)}, ${alpha})`
        : hex;
};

/**
 * A hover/active shift by a fixed step: darker in light mode, lighter in dark, so a state always
 * moves *away* from the surface it sits on. This is the "fixed lightness step" rule from C4.
 */
export const shiftForState = (hex: string, mode: "light" | "dark", amount: number): string => {
    return mode === "light" ? darken(hex, amount) : lighten(hex, amount);
};

/** Perceived lightness (0–1) via relative luminance, for choosing a legible foreground. */
export const isLight = (hex: string): boolean => {
    const rgb = parseHex(hex);
    if (!rgb) {
        return true;
    }
    const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    return luminance > 0.5;
};

/** A colour with its light and dark values — the shape derivation reads and writes. */
export interface ModeColor {
    light: string;
    dark: string;
}

/**
 * The small set of colours a derivation reads. Blank-theme seeding fills these from the default
 * palette; extraction fills them from the site (C13). The states below are then computed from them so
 * neither has to hand-fill or ask a model for the full 67-slot set (C4).
 */
export interface DerivationBases {
    /** `action.primary.background`. */
    primary: ModeColor;
    /** `action.secondary.background`. */
    secondary: ModeColor;
    /** `feedback.danger.foreground` — the saturated danger accent a destructive button is built on. */
    danger: ModeColor;
    /** `action.primary.foreground` — the legible foreground on a filled action (usually near-white). */
    onAction: ModeColor;
    /**
     * `text.link` — the accent already tuned to read as text on the page in each mode. Ghost buttons
     * show accent text on a transparent fill, so this (not the mid-tone action background) is what
     * keeps them legible in dark mode as well as light.
     */
    link: ModeColor;
    /** `text.primary` — the darkest ink; the scrim is built on it so a backdrop is always dark. */
    ink: ModeColor;
    /** `text.muted`. */
    mutedText: ModeColor;
    /** `surface.sunken` — the recessed surface a disabled control sits on. */
    sunkenSurface: ModeColor;
}

const perMode = (
    base: ModeColor,
    fn: (hex: string, mode: "light" | "dark") => string
): ModeColor => ({
    light: fn(base.light, "light"),
    dark: fn(base.dark, "dark")
});

/**
 * Derives the action states and the scrim from a base set — the rules in C4, shared by seeding and
 * extraction so a generated theme and a blank one derive identically. Ghost is the brand colour as
 * text on a transparent fill; destructive is the danger colour as a solid button; disabled is muted
 * text on a sunken surface; hover/active step a fixed amount away from their base; the scrim is the
 * darkest surface at reduced opacity. Every result is a plain value, not a live formula.
 */
export const deriveActionAndSurfaceStates = (bases: DerivationBases): Record<string, ModeColor> => {
    const { primary, secondary, danger, onAction, link, ink, mutedText, sunkenSurface } = bases;

    const destructiveForeground: ModeColor = {
        light: isLight(danger.light) ? ink.light : onAction.light,
        dark: isLight(danger.dark) ? ink.dark : onAction.dark
    };

    return {
        "color.action.primary.hover": perMode(primary, (hex, mode) =>
            shiftForState(hex, mode, 0.1)
        ),
        "color.action.primary.active": perMode(primary, (hex, mode) =>
            shiftForState(hex, mode, 0.16)
        ),
        "color.action.secondary.hover": perMode(secondary, (hex, mode) =>
            shiftForState(hex, mode, 0.06)
        ),
        "color.action.secondary.active": perMode(secondary, (hex, mode) =>
            shiftForState(hex, mode, 0.1)
        ),
        "color.action.ghost.background": { light: "transparent", dark: "transparent" },
        "color.action.ghost.foreground": { light: link.light, dark: link.dark },
        "color.action.ghost.hover": {
            light: withAlpha(primary.light, 0.08),
            dark: withAlpha(primary.dark, 0.16)
        },
        "color.action.ghost.active": {
            light: withAlpha(primary.light, 0.14),
            dark: withAlpha(primary.dark, 0.24)
        },
        "color.action.destructive.background": { light: danger.light, dark: danger.dark },
        "color.action.destructive.foreground": destructiveForeground,
        "color.action.destructive.hover": perMode(danger, (hex, mode) =>
            shiftForState(hex, mode, 0.12)
        ),
        "color.action.destructive.active": perMode(danger, (hex, mode) =>
            shiftForState(hex, mode, 0.18)
        ),
        "color.action.disabled.background": {
            light: sunkenSurface.light,
            dark: sunkenSurface.dark
        },
        "color.action.disabled.foreground": { light: mutedText.light, dark: mutedText.dark },
        // The scrim is a dark wash behind a modal regardless of theme, so it is built on the ink (the
        // darkest colour in a light theme), never on a surface that might itself be light.
        "color.surface.scrim": {
            light: withAlpha(ink.light, 0.5),
            dark: withAlpha("#000000", 0.6)
        }
    };
};
