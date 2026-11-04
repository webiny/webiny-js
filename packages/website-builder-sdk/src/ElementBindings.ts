import deepEqual from "deep-equal";
import type { DocumentElementBindings } from "./types.js";

type Binding = DocumentElementBindings;
type BindingMap = Record<string, any>;
type BreakpointOverrides = NonNullable<Binding["overrides"]>;

/**
 * One layer of an element's bindings: its inputs, styles and per-breakpoint overrides. Bindings come in layers
 * when a page or layout overrides an element it doesn't own: a global's stored record → the layout's override →
 * the page's override, or a layout's own component → the page's override. An override holds only the inputs
 * (and styles) it changes, so a layer may be missing altogether.
 *
 * Mirrors `ElementBindings` in `@webiny/api-website-builder`: the editor and the delivery API merge the layers
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

    /**
     * What an override must hold so that `inherited` with it on top gives this layer: only the inputs, styles,
     * breakpoint values, `$repeat` and `metadata` that differ. Missing when nothing differs.
     */
    diffFrom(inherited?: ElementBindings | Binding | null): ElementBindings {
        const current = this.binding;
        const base = ElementBindings.from(inherited).binding;
        if (!current) {
            return new ElementBindings(undefined);
        }

        const overrides: BreakpointOverrides = {};
        for (const breakpoint in current.overrides ?? {}) {
            const diff = withoutUndefined({
                inputs: diffMaps(
                    current.overrides?.[breakpoint]?.inputs,
                    base?.overrides?.[breakpoint]?.inputs,
                    toInputValue
                ),
                styles: diffMaps(
                    current.overrides?.[breakpoint]?.styles,
                    base?.overrides?.[breakpoint]?.styles
                )
            });
            if (Object.keys(diff).length) {
                overrides[breakpoint] = diff;
            }
        }

        const result: Binding = withoutUndefined({
            inputs: diffMaps(current.inputs, base?.inputs, toInputValue),
            styles: diffMaps(current.styles, base?.styles),
            overrides: Object.keys(overrides).length ? overrides : undefined,
            $repeat: isSame(current.$repeat, base?.$repeat) ? undefined : current.$repeat,
            metadata: isSame(current.metadata, base?.metadata) ? undefined : current.metadata
        });

        return new ElementBindings(Object.keys(result).length ? result : undefined);
    }

    toJSON(): Binding | undefined {
        return this.binding;
    }
}

const isPlainObject = (value: unknown): value is BindingMap => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const withoutUndefined = <T extends BindingMap>(value: T): T => {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined)
    ) as T;
};

const mergeMaps = <T extends BindingMap>(base?: T, override?: T): T | undefined => {
    const left = isPlainObject(base) ? base : undefined;
    const right = isPlainObject(override) ? override : undefined;
    if (!left || !right) {
        return right ?? left;
    }
    return { ...left, ...right };
};

const mergeBreakpoints = (
    base?: BreakpointOverrides,
    override?: BreakpointOverrides
): BreakpointOverrides | undefined => {
    const left = isPlainObject(base) ? base : undefined;
    const right = isPlainObject(override) ? override : undefined;
    if (!left || !right) {
        return right ?? left;
    }

    const result: BreakpointOverrides = { ...left };
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

// An input's value: what it shows. Its other properties (its id, type, ...) don't make it differ.
const toInputValue = (binding: any) => {
    return binding ? { static: binding.static, expression: binding.expression } : undefined;
};

const isSame = (a: unknown, b: unknown) => deepEqual(a, b, { strict: true });

const diffMaps = <T extends BindingMap>(
    current?: T,
    inherited?: T,
    toValue: (value: any) => unknown = value => value
): T | undefined => {
    if (!current) {
        return undefined;
    }

    const result: BindingMap = {};
    for (const key in current) {
        if (!isSame(toValue(current[key]), toValue(inherited?.[key]))) {
            result[key] = current[key];
        }
    }
    return Object.keys(result).length ? (result as T) : undefined;
};
