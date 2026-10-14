import type { ThemePolicy } from "@webiny/theme-common";
import type { DarkModeOutcome } from "./payload.js";

export interface ColorSchemeDecision {
    colorScheme: ThemePolicy["colorScheme"];
    defaultMode: ThemePolicy["defaultMode"];
}

/**
 * Whether the extracted theme ships a dark palette.
 *
 * Both have to hold: the crawl saw the page turn dark, and the model gave us dark values we kept. The
 * probe alone is not enough. When it fires but no dark value survives, every dark slot is the seeded
 * Webiny default, a dark theme unrelated to the site; with `defaultMode: "system"` a visitor (or an
 * editor) whose system is dark then sees it in place of the site's own colours. A light-only theme
 * is the honest result: it is what the site was captured as.
 */
export const decideColorScheme = (
    darkMode: DarkModeOutcome,
    darkAcceptedCount: number
): ColorSchemeDecision => {
    const hasDarkVariant = darkMode.probed && darkMode.hasDarkVariant && darkAcceptedCount > 0;
    return hasDarkVariant
        ? { colorScheme: "light-dark", defaultMode: "system" }
        : { colorScheme: "single", defaultMode: "light" };
};
