import deepEqual from "deep-equal";
import type { DocumentBindings, DocumentElementBindings } from "@webiny/website-builder-sdk";

/**
 * Bindings of an element come in layers when a page or layout overrides an element it doesn't own:
 * a global's stored record → the layout's override → the page's override, or a layout's own component →
 * the page's override. An override holds only the inputs (and styles) it changes, stored under the
 * element's id in the overriding document's `bindings`.
 */
type BreakpointOverrides = NonNullable<DocumentElementBindings["overrides"]>;

const mergeMaps = <T extends Record<string, any>>(base?: T, override?: T): T | undefined => {
    if (!base) {
        return override;
    }
    if (!override) {
        return base;
    }
    return { ...base, ...override };
};

const mergeBreakpoints = (
    base?: BreakpointOverrides,
    override?: BreakpointOverrides
): BreakpointOverrides | undefined => {
    if (!base || !override) {
        return override ?? base;
    }

    const result: BreakpointOverrides = { ...base };
    for (const breakpoint in override) {
        result[breakpoint] = {
            ...base[breakpoint],
            ...override[breakpoint],
            inputs: mergeMaps(base[breakpoint]?.inputs, override[breakpoint]?.inputs),
            styles: mergeMaps(base[breakpoint]?.styles, override[breakpoint]?.styles)
        };
    }
    return result;
};

const withoutUndefined = <T extends Record<string, any>>(value: T): T => {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined)
    ) as T;
};

// One element's bindings with `override` on top: each input, style and breakpoint value it holds wins.
export const mergeBindings = (
    base?: DocumentElementBindings,
    override?: DocumentElementBindings
): DocumentElementBindings | undefined => {
    if (!base || !override) {
        return override ?? base;
    }

    return withoutUndefined({
        ...base,
        ...override,
        inputs: mergeMaps(base.inputs, override.inputs),
        styles: mergeMaps(base.styles, override.styles),
        overrides: mergeBreakpoints(base.overrides, override.overrides)
    });
};

// An input's value: what it shows. Its other properties (its id, type, ...) don't make it differ.
const toInputValue = (binding: any) => {
    return binding ? { static: binding.static, expression: binding.expression } : undefined;
};

const diffMaps = <T extends Record<string, any>>(
    current?: T,
    inherited?: T,
    toValue: (value: any) => unknown = value => value
): T | undefined => {
    if (!current) {
        return undefined;
    }

    const result: Record<string, any> = {};
    for (const key in current) {
        if (!deepEqual(toValue(current[key]), toValue(inherited?.[key]), { strict: true })) {
            result[key] = current[key];
        }
    }
    return Object.keys(result).length ? (result as T) : undefined;
};

/**
 * What an override must hold so that `inherited` with it on top gives `current`: only the inputs,
 * styles and breakpoint values that differ. `undefined` when nothing differs.
 */
export const diffBindings = (
    current?: DocumentElementBindings,
    inherited?: DocumentElementBindings
): DocumentElementBindings | undefined => {
    if (!current) {
        return undefined;
    }

    const overrides: BreakpointOverrides = {};
    for (const breakpoint in current.overrides ?? {}) {
        const diff = withoutUndefined({
            inputs: diffMaps(
                current.overrides?.[breakpoint]?.inputs,
                inherited?.overrides?.[breakpoint]?.inputs,
                toInputValue
            ),
            styles: diffMaps(
                current.overrides?.[breakpoint]?.styles,
                inherited?.overrides?.[breakpoint]?.styles
            )
        });
        if (Object.keys(diff).length) {
            overrides[breakpoint] = diff;
        }
    }

    const result: DocumentElementBindings = withoutUndefined({
        inputs: diffMaps(current.inputs, inherited?.inputs, toInputValue),
        styles: diffMaps(current.styles, inherited?.styles),
        overrides: Object.keys(overrides).length ? overrides : undefined,
        $repeat: deepEqual(current.$repeat, inherited?.$repeat, { strict: true })
            ? undefined
            : current.$repeat,
        metadata: deepEqual(current.metadata, inherited?.metadata, { strict: true })
            ? undefined
            : current.metadata
    });

    return Object.keys(result).length ? result : undefined;
};

// `mergeBindings` for every element of `override`, on top of `base`.
export const mergeDocumentBindings = (
    base: DocumentBindings,
    override: DocumentBindings
): DocumentBindings => {
    const result: DocumentBindings = { ...base };
    for (const id in override) {
        result[id] = mergeBindings(base[id], override[id])!;
    }
    return result;
};
