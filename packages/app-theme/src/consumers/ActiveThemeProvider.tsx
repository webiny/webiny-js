import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFeature } from "@webiny/app-admin";
import {
    CANONICAL_COLOR_SLOTS,
    createDefaultPolicy,
    type ResolvedThemeSnapshot,
    type ThemeMode,
    type ThemePolicy,
    type TokenPath
} from "@webiny/theme-common";
import { ThemeGatewayFeature } from "~/features/themeGateway/feature.js";

export interface ActiveThemeColorSwatch {
    path: TokenPath;
    label: string;
    groupLabel: string;
    value: string;
}

export interface ActiveThemeContextValue {
    /**
     * `false` while the first read is in flight. Consumers should behave as if no theme is active
     * until this is `true`, rather than flashing a constrained picker open.
     */
    loaded: boolean;
    /**
     * `null` when no theme is active. This is a first-class, permanently supported state — many
     * projects will never opt in, and every consumer must keep working without one. See the Theme
     * design brief, section 9.
     */
    snapshot: ResolvedThemeSnapshot | null;
    policy: ThemePolicy;
    colorSwatches(mode: ThemeMode): ActiveThemeColorSwatch[];
}

const NO_THEME: ActiveThemeContextValue = {
    loaded: true,
    snapshot: null,
    // Permissive defaults, so a project with no theme sees today's freeform behaviour everywhere.
    policy: createDefaultPolicy(),
    colorSwatches: () => []
};

const ActiveThemeContext = createContext<ActiveThemeContextValue>(NO_THEME);

/**
 * Reads the tenant's active theme once and shares it with every consumer that needs to offer or
 * constrain a value: the color picker, the Website Builder style sidebar, the rich-text toolbar.
 *
 * It reads the *published* snapshot rather than the draft, because that is what the live site
 * renders — offering an editor a color that has not been published yet would let them apply a
 * variable the frontend cannot resolve.
 */
export const ActiveThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { gateway } = useFeature(ThemeGatewayFeature);
    const [state, setState] = useState<{ loaded: boolean; snapshot: ResolvedThemeSnapshot | null }>(
        {
            loaded: false,
            snapshot: null
        }
    );

    useEffect(() => {
        let cancelled = false;

        gateway
            .getActive()
            .then(result => {
                if (!cancelled) {
                    setState({ loaded: true, snapshot: result?.theme?.resolved ?? null });
                }
            })
            .catch(() => {
                // A failed read degrades to "no active theme" rather than breaking every picker in
                // Admin. The Theme app's own screens surface the error; consumers should not.
                if (!cancelled) {
                    setState({ loaded: true, snapshot: null });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [gateway]);

    const value = useMemo<ActiveThemeContextValue>(() => {
        const snapshot = state.snapshot;

        if (!snapshot) {
            return { ...NO_THEME, loaded: state.loaded };
        }

        const policy = snapshot.policy ?? createDefaultPolicy();
        const allowed = policy.color.allowedSlots;

        return {
            loaded: state.loaded,
            snapshot,
            policy,
            colorSwatches: (mode: ThemeMode) => {
                const byPath = new Map(snapshot.modes[mode].map(token => [token.path, token]));

                return CANONICAL_COLOR_SLOTS.filter(slot => {
                    if (allowed !== null && !allowed.includes(slot.path)) {
                        return false;
                    }
                    // Deprecated tokens disappear from every selection surface so nothing new picks
                    // them up, while published output still emits their variables.
                    return byPath.get(slot.path)?.deprecated !== true;
                })
                    .map(slot => {
                        const value = byPath.get(slot.path)?.value;
                        return typeof value === "string"
                            ? {
                                  path: slot.path,
                                  label: slot.label,
                                  groupLabel: slot.groupLabel,
                                  value
                              }
                            : null;
                    })
                    .filter((swatch): swatch is ActiveThemeColorSwatch => swatch !== null);
            }
        };
    }, [state]);

    return <ActiveThemeContext.Provider value={value}>{children}</ActiveThemeContext.Provider>;
};

/**
 * The active theme, for consumers outside the Theme app.
 *
 * Safe to call with no provider mounted: it returns the no-theme value, so a consumer rendered in
 * isolation (a test, a Storybook story) behaves as it would on a project that never adopted a theme.
 */
export const useActiveTheme = (): ActiveThemeContextValue => useContext(ActiveThemeContext);
