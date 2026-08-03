/**
 * A deliberately small colour parser. It covers the formats a token document can realistically
 * hold — hex and `rgb()`/`rgba()` — and returns `null` for anything else, so a contrast check
 * reports "not checked" rather than inventing a number from a colour it did not understand.
 *
 * No dependency: `tinycolor2` exists in the Admin app but pulling it into a package the API and the
 * frontend SDK both consume is not worth it for this much arithmetic.
 */

export interface Rgba {
    r: number;
    g: number;
    b: number;
    /** 0–1. */
    a: number;
}

const HEX_PATTERN = /^#([0-9a-f]{3,8})$/i;
const RGB_PATTERN = /^rgba?\(([^)]+)\)$/i;

const clamp255 = (value: number): number => Math.min(255, Math.max(0, value));

const parseHex = (input: string): Rgba | null => {
    const match = HEX_PATTERN.exec(input);
    if (!match) {
        return null;
    }

    const hex = match[1];
    const expand = (value: string): number => Number.parseInt(value.repeat(2), 16);

    if (hex.length === 3 || hex.length === 4) {
        return {
            r: expand(hex[0]),
            g: expand(hex[1]),
            b: expand(hex[2]),
            a: hex.length === 4 ? expand(hex[3]) / 255 : 1
        };
    }

    if (hex.length === 6 || hex.length === 8) {
        return {
            r: Number.parseInt(hex.slice(0, 2), 16),
            g: Number.parseInt(hex.slice(2, 4), 16),
            b: Number.parseInt(hex.slice(4, 6), 16),
            a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1
        };
    }

    return null;
};

const parseRgb = (input: string): Rgba | null => {
    const match = RGB_PATTERN.exec(input);
    if (!match) {
        return null;
    }

    const parts = match[1]
        .split(/[,/\s]+/)
        .map(part => part.trim())
        .filter(part => part.length > 0);

    if (parts.length < 3 || parts.length > 4) {
        return null;
    }

    const channel = (raw: string): number | null => {
        if (raw.endsWith("%")) {
            const percent = Number.parseFloat(raw.slice(0, -1));
            return Number.isFinite(percent) ? clamp255((percent / 100) * 255) : null;
        }
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? clamp255(value) : null;
    };

    const [r, g, b] = [channel(parts[0]), channel(parts[1]), channel(parts[2])];
    if (r === null || g === null || b === null) {
        return null;
    }

    let alpha = 1;
    if (parts.length === 4) {
        const raw = parts[3];
        const parsed = raw.endsWith("%")
            ? Number.parseFloat(raw.slice(0, -1)) / 100
            : Number.parseFloat(raw);
        if (!Number.isFinite(parsed)) {
            return null;
        }
        alpha = Math.min(1, Math.max(0, parsed));
    }

    return { r, g, b, a: alpha };
};

export const parseColor = (input: unknown): Rgba | null => {
    if (typeof input !== "string") {
        return null;
    }

    const value = input.trim();
    if (value.length === 0) {
        return null;
    }

    if (value.toLowerCase() === "transparent") {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    return parseHex(value) ?? parseRgb(value);
};

/** Composites a translucent foreground over an opaque background. */
export const compositeOver = (foreground: Rgba, background: Rgba): Rgba => {
    if (foreground.a >= 1) {
        return foreground;
    }

    const blend = (fg: number, bg: number): number => fg * foreground.a + bg * (1 - foreground.a);

    return {
        r: blend(foreground.r, background.r),
        g: blend(foreground.g, background.g),
        b: blend(foreground.b, background.b),
        a: 1
    };
};

/** WCAG 2.x relative luminance. */
export const relativeLuminance = ({ r, g, b }: Rgba): number => {
    const channel = (value: number): number => {
        const sRgb = value / 255;
        return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG 2.x contrast ratio, 1–21. */
export const contrastRatio = (foreground: Rgba, background: Rgba): number => {
    const fg = relativeLuminance(compositeOver(foreground, background));
    const bg = relativeLuminance(background);

    const lighter = Math.max(fg, bg);
    const darker = Math.min(fg, bg);

    return (lighter + 0.05) / (darker + 0.05);
};
