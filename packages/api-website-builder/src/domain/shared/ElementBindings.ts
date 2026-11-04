type Binding = Record<string, any>;

/**
 * One layer of an element's bindings: its inputs, styles and per-breakpoint overrides. A layer holds only
 * what it sets, so it may be missing altogether.
 *
 * Mirrors `ElementBindings` in `@webiny/website-builder-sdk`: the editor and the delivery API merge the layers
 * with the same rule. Keep the two in step.
 */
export class ElementBindings {
    private readonly binding: Binding | undefined;

    private constructor(binding: Binding | undefined) {
        this.binding = binding;
    }

    static from(binding?: ElementBindings | Binding | null): ElementBindings {
        if (binding instanceof ElementBindings) {
            return binding;
        }
        return new ElementBindings(isPlainObject(binding) ? binding : undefined);
    }

    /**
     * A later layer on top of this one: each input, style and breakpoint value the later layer holds wins.
     * When either layer is missing, the result is the other one, as it is.
     */
    mergeWith(other?: ElementBindings | Binding | null): ElementBindings {
        const base = this.binding;
        const override = ElementBindings.from(other).binding;
        if (!base || !override) {
            return new ElementBindings(override ?? base);
        }

        return new ElementBindings(
            withoutUndefined({
                ...base,
                ...override,
                inputs: mergeMaps(base.inputs, override.inputs),
                styles: mergeMaps(base.styles, override.styles),
                overrides: mergeBreakpoints(base.overrides, override.overrides)
            })
        );
    }

    toJSON(): Binding | undefined {
        return this.binding;
    }
}

const isPlainObject = (value: unknown): value is Binding => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const withoutUndefined = (value: Binding): Binding => {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
};

const mergeMaps = (base?: Binding, override?: Binding): Binding | undefined => {
    const left = isPlainObject(base) ? base : undefined;
    const right = isPlainObject(override) ? override : undefined;
    if (!left || !right) {
        return right ?? left;
    }
    return { ...left, ...right };
};

const mergeBreakpoints = (base?: Binding, override?: Binding): Binding | undefined => {
    const left = isPlainObject(base) ? base : undefined;
    const right = isPlainObject(override) ? override : undefined;
    if (!left || !right) {
        return right ?? left;
    }

    const result: Binding = { ...left };
    for (const breakpoint in right) {
        result[breakpoint] = withoutUndefined({
            ...left[breakpoint],
            ...right[breakpoint],
            inputs: mergeMaps(left[breakpoint]?.inputs, right[breakpoint]?.inputs),
            styles: mergeMaps(left[breakpoint]?.styles, right[breakpoint]?.styles)
        });
    }
    return result;
};
