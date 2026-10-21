type Binding = Record<string, any>;

/**
 * One layer of an element's bindings: its inputs, styles and per-breakpoint overrides. A layer holds only
 * what it sets, so it may be missing altogether.
 */
export class ElementBindings {
    private readonly binding: Binding;

    private constructor(binding: Binding) {
        this.binding = binding;
    }

    static from(binding?: Binding | null): ElementBindings {
        return new ElementBindings(ElementBindings.asObject(binding));
    }

    private static asObject(value: unknown): Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
    }

    /**
     * Merge a later layer over this one; the later layer wins per input and per style,
     * also per breakpoint override.
     */
    mergeWith(other?: ElementBindings | Binding | null): ElementBindings {
        const asObject = ElementBindings.asObject;
        const left = this.binding;
        const right = other instanceof ElementBindings ? other.binding : asObject(other);

        const leftOverrides = asObject(left.overrides);
        const rightOverrides = asObject(right.overrides);

        const overrides: Record<string, any> = {};
        for (const breakpoint of new Set([
            ...Object.keys(leftOverrides),
            ...Object.keys(rightOverrides)
        ])) {
            const leftBreakpoint = asObject(leftOverrides[breakpoint]);
            const rightBreakpoint = asObject(rightOverrides[breakpoint]);

            overrides[breakpoint] = {
                ...leftBreakpoint,
                ...rightBreakpoint,
                inputs: { ...asObject(leftBreakpoint.inputs), ...asObject(rightBreakpoint.inputs) },
                styles: { ...asObject(leftBreakpoint.styles), ...asObject(rightBreakpoint.styles) }
            };
        }

        return new ElementBindings({
            ...left,
            ...right,
            inputs: { ...asObject(left.inputs), ...asObject(right.inputs) },
            styles: { ...asObject(left.styles), ...asObject(right.styles) },
            overrides
        });
    }

    toJSON(): Binding {
        return this.binding;
    }
}
