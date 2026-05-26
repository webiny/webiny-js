import set from "lodash/set.js";
import unset from "lodash/unset.js";
import { toJS } from "mobx";
import type { DocumentElementBindings, DocumentElementStyleBindings } from "~/types.js";
import { InheritedValueResolver } from "~/InheritedValueResolver.js";
import { StylesUpdater } from "./StylesUpdater.js";

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
     */
    public toDeepStyles(styles: DocumentElementBindings["styles"] = {}): DeepBindings {
        const result: DeepBindings = {};
        Object.keys(styles).forEach(key => {
            // @ts-expect-error Style keys cannot be indexed with a string.
            result[key] = styles[key].static;
        });
        return result;
    }

    /**
     * Flattens deep styles object into flat bindings with `.static` wrappers.
     * Skips overrides where the value matches inherited parent breakpoint.
     */
    public createUpdate(styles: DeepBindings, currentBreakpoint: string) {
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
            if (this.isBaseBreakpoint(currentBreakpoint)) {
                set(rebuilt, `styles.${key}.static`, value);
            } else {
                const inheritedValue = valueResolver.getInheritedValue(key, currentBreakpoint);

                if (value !== inheritedValue) {
                    set(rebuilt, `overrides.${currentBreakpoint}.styles.${key}.static`, value);
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
