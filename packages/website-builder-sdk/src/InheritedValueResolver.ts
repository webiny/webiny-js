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

    getInheritedValue(key: string, breakpoint: string): ValueBinding | undefined {
        const currentIndex = this.breakpoints.indexOf(breakpoint);
        // Walk backwards from currentIndex - 1 to 0
        for (let i = currentIndex - 1; i >= 0; i--) {
            const bp = this.breakpoints[i];
            const bindings = this.getBindings(bp);

            if (!bindings) {
                continue;
            }

            const value = bindings[key]?.static;
            if (value !== undefined) {
                return value;
            }
        }
        return undefined;
    }

    /**
     * The id of the binding a breakpoint resolves to before its own override: the nearest wider breakpoint's
     * binding with an id. Bindings are merged breakpoint over breakpoint, so that id wins even where the
     * binding holds no value (the editor stores metadata under it).
     */
    getInheritedBindingId(key: string, breakpoint: string): string | undefined {
        const currentIndex = this.breakpoints.indexOf(breakpoint);
        for (let i = currentIndex - 1; i >= 0; i--) {
            const id = (this.getBindings(this.breakpoints[i])?.[key] as { id?: string } | undefined)
                ?.id;
            if (id !== undefined) {
                return id;
            }
        }
        return undefined;
    }
}
