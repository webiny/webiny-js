import type { ValueBinding } from "~/types.js";

export interface GetBreakpointBindings {
    (breakpoint: string): Record<string, ValueBinding> | undefined;
}

export class InheritedValueResolver {
    private readonly breakpoints: string[];
    private readonly getBindings: GetBreakpointBindings;

    constructor(breakpoints: string[], getBindings: GetBreakpointBindings) {
        this.breakpoints = breakpoints;
        this.getBindings = getBindings;
    }

    /**
     * The literal inherited from the nearest ancestor breakpoint.
     *
     * Returns the `static` value, not a binding — the declared return type used to say `ValueBinding`,
     * which was simply wrong and made the token work below look impossible when it is not.
     */
    getInheritedValue(key: string, breakpoint: string): unknown {
        return this.getInheritedBinding(key, breakpoint)?.static;
    }

    /**
     * The whole binding inherited from the nearest ancestor breakpoint.
     *
     * Needed because a token reference has no `static` value: read through `getInheritedValue` alone, a
     * property whose parent breakpoint holds a token looks unset, so an override would be written even
     * when it matches what it inherits — and the theme would then stop reaching that breakpoint.
     *
     * A binding counts as present if it carries either a literal or a token, which is exactly the
     * invariant `ValueBinding` maintains: one or the other, never both.
     */
    getInheritedBinding(key: string, breakpoint: string): ValueBinding | undefined {
        const currentIndex = this.breakpoints.indexOf(breakpoint);
        // Walk backwards from currentIndex - 1 to 0
        for (let i = currentIndex - 1; i >= 0; i--) {
            const bp = this.breakpoints[i];
            const bindings = this.getBindings(bp);

            if (!bindings) {
                continue;
            }

            const binding = bindings[key];
            if (binding?.static !== undefined || binding?.token !== undefined) {
                return binding;
            }
        }
        return undefined;
    }
}
