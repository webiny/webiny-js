import type { ResolvedToken } from "~/resolve/alias.js";
import type { ThemeMode, TokenPath } from "~/dtcg/types.js";
import { contrastRatio, parseColor } from "./color.js";

/**
 * Contrast is computed only for canonical foreground/background pairs the schema knows are meant to
 * sit together. There is no score, no panel and no blocking — a failing pair produces one warning
 * attached to the foreground token. See the design brief, section 11.
 */

export interface ContrastPair {
    foreground: TokenPath;
    background: TokenPath;
    /** WCAG minimum. 4.5 for body text, 3 for large text and non-text UI components. */
    minRatio: number;
    label: string;
}

const textPair = (foreground: TokenPath, background: TokenPath, label: string): ContrastPair => ({
    foreground,
    background,
    minRatio: 4.5,
    label
});

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
    textPair("color.text.primary", "color.surface.page", "Primary text on page"),
    textPair("color.text.secondary", "color.surface.page", "Secondary text on page"),
    textPair("color.text.muted", "color.surface.page", "Muted text on page"),
    textPair("color.text.link", "color.surface.page", "Link text on page"),
    textPair("color.text.primary", "color.surface.raised", "Primary text on raised surface"),
    textPair("color.text.primary", "color.surface.sunken", "Primary text on sunken surface"),
    textPair(
        "color.action.primary.foreground",
        "color.action.primary.background",
        "Primary action label"
    ),
    textPair(
        "color.action.secondary.foreground",
        "color.action.secondary.background",
        "Secondary action label"
    ),
    // `color.text.inverse` is deliberately absent. Its intended background is whatever surface the
    // theme inverts onto, which is not a canonical slot, so any pairing we picked here would be a
    // guess. The case that matters — a label on a filled button — is covered by the
    // action foreground/background pairs above.
    textPair("color.feedback.info.foreground", "color.feedback.info.background", "Info message"),
    textPair(
        "color.feedback.success.foreground",
        "color.feedback.success.background",
        "Success message"
    ),
    textPair(
        "color.feedback.warning.foreground",
        "color.feedback.warning.background",
        "Warning message"
    ),
    textPair(
        "color.feedback.danger.foreground",
        "color.feedback.danger.background",
        "Danger message"
    ),
    {
        foreground: "color.border.focus",
        background: "color.surface.page",
        minRatio: 3,
        label: "Focus ring on page"
    },
    {
        foreground: "color.border.strong",
        background: "color.surface.page",
        minRatio: 3,
        label: "Strong border on page"
    }
];

export type ContrastStatus = "pass" | "fail" | "not-checked";

export interface ContrastWarning {
    pair: ContrastPair;
    mode: ThemeMode;
    status: ContrastStatus;
    /** Rounded to two decimals. Absent when the status is `not-checked`. */
    ratio?: number;
    /** Why the pair could not be checked, when the status is `not-checked`. */
    reason?: string;
    message: string;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const checkPair = (
    pair: ContrastPair,
    resolved: ReadonlyMap<TokenPath, ResolvedToken>,
    mode: ThemeMode
): ContrastWarning => {
    const foreground = resolved.get(pair.foreground);
    const background = resolved.get(pair.background);

    const notChecked = (reason: string): ContrastWarning => ({
        pair,
        mode,
        status: "not-checked",
        reason,
        message: `${pair.label} could not be checked: ${reason}`
    });

    if (!foreground) {
        return notChecked(`"${pair.foreground}" did not resolve to a value.`);
    }
    if (!background) {
        return notChecked(`"${pair.background}" did not resolve to a value.`);
    }

    const fg = parseColor(foreground.value);
    const bg = parseColor(background.value);

    if (!fg) {
        return notChecked(`"${pair.foreground}" is not a colour this check understands.`);
    }
    if (!bg) {
        return notChecked(`"${pair.background}" is not a colour this check understands.`);
    }

    const ratio = round2(contrastRatio(fg, bg));
    const pass = ratio >= pair.minRatio;

    return {
        pair,
        mode,
        status: pass ? "pass" : "fail",
        ratio,
        message: pass
            ? `${pair.label} has a contrast ratio of ${ratio}:1.`
            : `${pair.label} has a contrast ratio of ${ratio}:1, below the ${pair.minRatio}:1 minimum.`
    };
};

/** Runs every canonical pair for one mode. */
export const checkContrast = (
    resolved: ReadonlyMap<TokenPath, ResolvedToken>,
    mode: ThemeMode
): ContrastWarning[] => {
    return CONTRAST_PAIRS.map(pair => checkPair(pair, resolved, mode));
};

/**
 * Runs every canonical pair against both modes and returns only the failures — the editor shows one
 * inline marker per failing token, so passes are noise.
 */
export const findContrastFailures = (
    resolvedByMode: Readonly<Record<ThemeMode, ReadonlyMap<TokenPath, ResolvedToken>>>
): ContrastWarning[] => {
    return [
        ...checkContrast(resolvedByMode.light, "light"),
        ...checkContrast(resolvedByMode.dark, "dark")
    ].filter(warning => warning.status === "fail");
};
