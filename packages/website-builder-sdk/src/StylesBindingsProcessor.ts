import set from "lodash/set.js";
import unset from "lodash/unset.js";
import { toJS } from "mobx";
import type {
    DocumentElementBindings,
    DocumentElementStyleBindings,
    TokenReference
} from "~/types.js";
import { InheritedValueResolver } from "~/InheritedValueResolver.js";
import { StylesUpdater } from "./StylesUpdater.js";
import { isTokenBinding, tokenToCssValue } from "./tokenBinding.js";

type DeepBindings = Record<string, any>;

export type ElementStylesBindings = {
    styles: DocumentElementStyleBindings;
    overrides: {
        [breakpoint: string]: {
            styles: DocumentElementStyleBindings;
        };
    };
};

/**
 * Handles deep-to-flat and flat-to-deep conversion of style bindings,
 * with breakpoint inheritance awareness.
 */
export class StylesBindingsProcessor {
    private breakpoints: string[];
    private rawBindings: DocumentElementBindings;
    private elementId: string;

    constructor(elementId: string, breakpoints: string[], rawBindings: DocumentElementBindings) {
        this.elementId = elementId;
        this.breakpoints = breakpoints;
        this.rawBindings = rawBindings;
    }

    /**
     * Converts flat style bindings into deep styles object (removes `.static`).
     *
     * A token reference yields its `var(--wby-…)` form, so the editor preview renders the themed
     * value. Use {@link toTokenMap} alongside this when you need to know that a value came from a
     * token rather than a literal — a picker has to show which token is selected.
     */
    public toDeepStyles(styles: DocumentElementBindings["styles"] = {}): DeepBindings {
        const result: DeepBindings = {};
        Object.keys(styles).forEach(key => {
            // @ts-expect-error Style keys cannot be indexed with a string.
            const binding = styles[key];
            result[key] = isTokenBinding(binding) ? tokenToCssValue(binding.token) : binding.static;
        });
        return result;
    }

    /** The token references among these bindings, keyed by CSS property. */
    public toTokenMap(
        styles: DocumentElementBindings["styles"] = {}
    ): Record<string, TokenReference> {
        const result: Record<string, TokenReference> = {};
        Object.keys(styles).forEach(key => {
            // @ts-expect-error Style keys cannot be indexed with a string.
            const binding = styles[key];
            if (isTokenBinding(binding)) {
                result[key] = binding.token;
            }
        });
        return result;
    }

    /**
     * Flattens deep styles object into flat bindings with `.static` wrappers.
     * Skips overrides where the value matches inherited parent breakpoint.
     *
     * @param tokens Properties in this map are written as token references instead of literals.
     *               A property absent from it is written as `static`, which is what clears a
     *               reference when someone picks a free value over a token.
     */
    public createUpdate(
        styles: DeepBindings,
        currentBreakpoint: string,
        tokens: Record<string, TokenReference> = {}
    ) {
        const rebuilt = this.getBaseStyles();
        const valueResolver = new InheritedValueResolver(this.breakpoints, breakpoint => {
            if (this.isBaseBreakpoint(breakpoint)) {
                return this.rawBindings.styles;
            }
            return this.rawBindings?.overrides?.[breakpoint]?.styles;
        });

        // Collect original keys for the breakpoint
        const originalStyles = this.isBaseBreakpoint(currentBreakpoint)
            ? this.rawBindings.styles || {}
            : this.rawBindings?.overrides?.[currentBreakpoint]?.styles || {};

        const newKeys = new Set(Object.keys(styles));
        const originalKeys = Object.keys(originalStyles);

        // Remove keys that no longer exist
        for (const key of originalKeys) {
            if (!newKeys.has(key)) {
                if (this.isBaseBreakpoint(currentBreakpoint)) {
                    unset(rebuilt, `styles.${key}`);
                } else {
                    unset(rebuilt, `overrides.${currentBreakpoint}.styles.${key}`);
                }
            }
        }

        for (const [key, value] of Object.entries(styles)) {
            const token = tokens[key];

            if (this.isBaseBreakpoint(currentBreakpoint)) {
                if (token) {
                    // A binding holds either a reference or a literal, never both — leaving a stale
                    // `static` behind would make the stored value ambiguous.
                    unset(rebuilt, `styles.${key}`);
                    set(rebuilt, `styles.${key}.token`, token);
                } else {
                    unset(rebuilt, `styles.${key}`);
                    set(rebuilt, `styles.${key}.static`, value);
                }
            } else {
                const inheritedValue = valueResolver.getInheritedValue(key, currentBreakpoint);

                if (value !== inheritedValue) {
                    unset(rebuilt, `overrides.${currentBreakpoint}.styles.${key}`);
                    if (token) {
                        set(rebuilt, `overrides.${currentBreakpoint}.styles.${key}.token`, token);
                    } else {
                        set(rebuilt, `overrides.${currentBreakpoint}.styles.${key}.static`, value);
                    }
                } else {
                    unset(rebuilt, `overrides.${currentBreakpoint}.styles.${key}`);
                }
            }
        }

        return new StylesUpdater(this.elementId, rebuilt);
    }

    private getBaseStyles(): ElementStylesBindings {
        const baseStyles: ElementStylesBindings = {
            styles: structuredClone(toJS(this.rawBindings.styles)) ?? {},
            overrides: {}
        };

        // Clone existing overrides if present, to avoid losing breakpoint overrides
        if (this.rawBindings.overrides) {
            for (const [bp, overrides] of Object.entries(this.rawBindings.overrides)) {
                if (overrides.styles) {
                    set(
                        baseStyles,
                        `overrides.${bp}.styles`,
                        structuredClone(toJS(this.rawBindings.overrides[bp].styles))
                    );
                }
            }
        }

        return baseStyles;
    }

    private isBaseBreakpoint(name: string): boolean {
        return this.breakpoints.indexOf(name) === 0;
    }
}
