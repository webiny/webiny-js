import type { TokenPath } from "~/dtcg/types.js";

/**
 * Policy — see the design brief, section 5.
 *
 * Policy is not tokens, so it does not live in the DTCG tree. It sits in its own section of the
 * theme document, is versioned and published alongside the tokens, and is exported to the frontend.
 * It has its own extension mechanism, mirroring the token one.
 *
 * Enforcement happens in Admin, where the pickers live. It is exported to the frontend anyway,
 * because we expect frontend-relevant keys to appear and one delivery contract is simpler than two.
 */

export type ColorEntryMode = "theme-only" | "open";
export type FontSizeEntryMode = "ramp-only" | "open";
export type DefaultModeBehaviour = "system" | "light" | "dark";

export interface ColorPolicy {
    /** `theme-only` hides the free value input; `open` offers it alongside the theme swatches. */
    entry: ColorEntryMode;
    /**
     * Canonical slots offered in the picker. `null` means every non-deprecated slot. An empty array
     * means none, which is legal but leaves a constrained picker with nothing to choose.
     */
    allowedSlots: TokenPath[] | null;
}

export interface FontSizePolicy {
    entry: FontSizeEntryMode;
    /** Ramp steps offered in the picker. `null` means every step. */
    allowedSteps: string[] | null;
}

export interface ThemePolicy {
    color: ColorPolicy;
    fontSize: FontSizePolicy;
    /** How the site decides between light and dark before the visitor expresses a preference. */
    defaultMode: DefaultModeBehaviour;
    /**
     * Namespaced extension policy, mirroring `$extensions` on tokens. Keys are reverse-DNS
     * namespaces, e.g. `com.acme.motion`.
     */
    extensions: Record<string, unknown>;
}

/**
 * Policy defaults are permissive. A project that activates a theme without touching policy gets
 * today's behaviour in every picker, which is what section 9 requires.
 */
export const createDefaultPolicy = (): ThemePolicy => ({
    color: { entry: "open", allowedSlots: null },
    fontSize: { entry: "open", allowedSteps: null },
    defaultMode: "system",
    extensions: {}
});

/** True when the picker should hide its free-value input. */
export const isColorConstrained = (policy: ThemePolicy): boolean => {
    return policy.color.entry === "theme-only";
};

export const isFontSizeConstrained = (policy: ThemePolicy): boolean => {
    return policy.fontSize.entry === "ramp-only";
};
