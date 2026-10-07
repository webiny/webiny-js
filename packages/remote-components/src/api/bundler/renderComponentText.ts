import { createContext, runInNewContext } from "node:vm";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
    createBooleanInput,
    createColorInput,
    createDateInput,
    createFileInput,
    createInput,
    createLexicalInput,
    createLongTextInput,
    createNumberInput,
    createObjectInput,
    createRadioInput,
    createSelectInput,
    createSlotInput,
    createTagsInput,
    createTextInput
} from "@webiny/website-builder-sdk";

/**
 * Renders a bundled component with prop values applied and returns the text it produces.
 *
 * This exists because asking whether a component's *source code* contains a page's text is the wrong
 * question. A correctly parameterised component does not contain the text: a hero's headline arrives
 * as a prop, and office hours arrive as an array of `{ day, hours }` items, so the captured text node
 * "Monday: 9:00AM to 6:00PM" appears nowhere in the code and in both halves of the props. Measured
 * across five sites, 41% of text-preservation failures were exactly that — components skipped for
 * being properly built.
 *
 * Rendering answers the question that was meant: does this component, given its values, put the
 * page's text on the page.
 */
const sdkStub = {
    createComponent: (component: unknown, manifest: unknown) => ({ component, manifest }),
    createBooleanInput,
    createColorInput,
    createDateInput,
    createFileInput,
    createInput,
    createLexicalInput,
    createLongTextInput,
    createNumberInput,
    createObjectInput,
    createRadioInput,
    createSelectInput,
    createSlotInput,
    createTagsInput,
    createTextInput
};

/** Enough for a render; far short of anything that loops. */
const RENDER_TIMEOUT_MS = 2000;

export class ComponentRenderError extends Error {
    constructor(componentName: string, cause: unknown) {
        super(
            `Could not render "${componentName}": ${
                cause instanceof Error ? cause.message : String(cause)
            }`
        );
        this.name = "ComponentRenderError";
    }
}

interface ObservedProp {
    name: string;
    array?: boolean;
    observedValues?: string[];
    fields?: ObservedProp[];
}

type ManifestInput = {
    name?: string;
    type?: string;
    list?: boolean;
    defaultValue?: unknown;
    fields?: ManifestInput[];
};

const firstUseful = (values: string[] | undefined): string | undefined =>
    (values ?? []).find(value => typeof value === "string" && value.trim().length > 0);

/**
 * The props one render gets: the component's own declared defaults, with observed values laid over
 * them where an observation exists.
 *
 * Starting from the defaults matters more than it looks. An earlier version built props from the
 * observations alone, which left every input the pipeline had not observed empty or null — components
 * then rendered blanks, or crashed reaching into a null, and text that was present in their defaults
 * vanished from the render. Measured, that turned a 75% pass rate into 55%. A real instance merges
 * values over defaults, so this does too.
 */
const propsFromManifestAndObservations = (
    inputs: ManifestInput[],
    observed: ObservedProp[],
    manifestDefaults: Record<string, unknown> = {}
): Record<string, unknown> => {
    const observedByName = new Map(observed.map(prop => [prop.name, prop]));

    const valueFor = (input: ManifestInput): unknown => {
        const match = observedByName.get(input.name ?? "");

        /*
         * An image's value comes from the component's own defaults, never from observations: what
         * Plan observed for an image prop is its alt text, and a sentence in place of a URL is a
         * value no instance would hold.
         */
        if (input.type === "file") {
            return manifestDefaults[input.name ?? ""] ?? input.defaultValue ?? "";
        }

        if (input.fields?.length) {
            const fieldObservations = match?.fields ?? [];
            const byName = new Map(fieldObservations.map(f => [f.name, f]));

            if (input.list) {
                const listDefault = manifestDefaults[input.name ?? ""];
                const observedAny = (match?.fields ?? []).some(
                    f => (f.observedValues ?? []).length
                );
                if (!observedAny && Array.isArray(listDefault) && listDefault.length) {
                    return listDefault;
                }
                // Observations are deduped per field, so the rows the page showed cannot be rebuilt.
                // As many rows as the longest field's observations, each field falling back to its own
                // default rather than to an empty string.
                const rows = Math.max(
                    ...input.fields.map(f => byName.get(f.name ?? "")?.observedValues?.length ?? 0),
                    1
                );

                return Array.from({ length: rows }, (_, index) =>
                    Object.fromEntries(
                        input.fields!.map(field => {
                            const values = byName.get(field.name ?? "")?.observedValues ?? [];
                            const value = values[index];
                            // Images, and objects that hold them, come from the default row: observations
                            // carry their text, not their values.
                            if (field.type === "file" || field.fields?.length) {
                                const rowsDefault = Array.isArray(listDefault)
                                    ? (listDefault as Record<string, unknown>[])
                                    : [];
                                const row = rowsDefault[index] ?? rowsDefault[0];
                                return [field.name, row?.[field.name ?? ""] ?? field.defaultValue ?? ""];
                            }
                            return [
                                field.name,
                                typeof value === "string" && value.trim()
                                    ? value
                                    : (field.defaultValue ?? "")
                            ];
                        })
                    )
                );
            }

            const objectDefault = manifestDefaults[input.name ?? ""] as
                | Record<string, unknown>
                | undefined;

            return Object.fromEntries(
                input.fields.map(field => {
                    const values = byName.get(field.name ?? "")?.observedValues;
                    return [
                        field.name,
                        (field.type === "file" ? undefined : firstUseful(values)) ??
                            objectDefault?.[field.name ?? ""] ??
                            field.defaultValue ??
                            ""
                    ];
                })
            );
        }

        if (input.list) {
            const values = (match?.observedValues ?? []).filter(v => v && v.trim());
            return values.length ? values : (input.defaultValue ?? []);
        }

        return (
            firstUseful(match?.observedValues) ??
            (manifestDefaults[input.name ?? ""] as string | undefined) ??
            input.defaultValue ??
            ""
        );
    };

    return Object.fromEntries(
        inputs
            .filter(input => input.name)
            .map(input => [input.name, asStored(input, valueFor(input))])
    );
};

/** An image (file) input and the URLs it held in the render. */
export interface RenderedFile {
    /** Where the input sits, e.g. `logo.src` or `slides[].image`. */
    path: string;
    urls: string[];
    /** A list input: one of its items on screen is enough (a carousel shows one slide). */
    list: boolean;
}

export interface RenderedComponent {
    markup: string;
    text: string;
    files: RenderedFile[];
}

/** The URLs every file input was given in this render, by where the input sits. */
const fileValues = (inputs: ManifestInput[], props: Record<string, unknown>): RenderedFile[] => {
    const out: RenderedFile[] = [];
    const urlOf = (value: unknown): string | undefined =>
        value && typeof value === "object" && typeof (value as { url?: unknown }).url === "string"
            ? (value as { url: string }).url
            : undefined;
    const visit = (input: ManifestInput, value: unknown, path: string, inList: boolean): void => {
        if (input.type === "file") {
            const values = Array.isArray(value) ? value : [value];
            const urls = values.map(urlOf).filter((url): url is string => Boolean(url));
            if (urls.length > 0) {
                out.push({ path, urls, list: inList || Array.isArray(value) });
            }
            return;
        }
        if (!input.fields?.length || !value || typeof value !== "object") {
            return;
        }
        const rows = Array.isArray(value) ? value : [value];
        for (const field of input.fields) {
            const fieldPath = `${path}${Array.isArray(value) ? "[]" : ""}.${field.name}`;
            if (Array.isArray(value)) {
                const urls = rows.flatMap(row =>
                    field.type === "file" ? [urlOf((row as Record<string, unknown>)?.[field.name ?? ""])] : []
                );
                if (field.type === "file") {
                    const found = urls.filter((url): url is string => Boolean(url));
                    if (found.length > 0) {
                        out.push({ path: fieldPath, urls: found, list: true });
                    }
                    continue;
                }
            }
            for (const row of rows) {
                visit(field, (row as Record<string, unknown>)?.[field.name ?? ""], fieldPath, inList || Array.isArray(value));
            }
        }
    };
    for (const input of inputs) {
        if (input.name) {
            visit(input, props[input.name], input.name, false);
        }
    }
    // A field inside list rows is visited once per row; it is one list input.
    const byPath = new Map<string, RenderedFile>();
    for (const file of out) {
        const existing = byPath.get(file.path);
        if (existing) {
            existing.urls.push(...file.urls);
            existing.list = true;
        } else {
            byPath.set(file.path, { ...file, urls: [...file.urls] });
        }
    }
    return [...byPath.values()];
};

/**
 * A file input's value as the editor stores it: `{ url }`, and nothing else.
 *
 * A component's defaults are its own to write, so they can give a file input any shape, and a
 * component can read whatever shape it wrote. One did exactly that — a default of `{ url, src }` and a
 * component reading `.src` — which renders here and goes blank the moment an editor picks a different
 * image, because the picked file carries `url` only. Rendering with what an instance would actually
 * hold makes that visible.
 */
const asStoredFile = (value: unknown): unknown => {
    if (typeof value === "string") {
        return value ? { url: value } : value;
    }
    if (value && typeof value === "object" && "url" in value) {
        return { url: (value as { url: unknown }).url };
    }
    return value;
};

const asStored = (input: ManifestInput, value: unknown): unknown => {
    if (input.type === "file") {
        return Array.isArray(value) ? value.map(asStoredFile) : asStoredFile(value);
    }
    if (input.fields?.length && value && typeof value === "object") {
        const row = (item: unknown) =>
            item && typeof item === "object"
                ? Object.fromEntries(
                      Object.entries(item as Record<string, unknown>).map(([name, fieldValue]) => {
                          const field = input.fields!.find(f => f.name === name);
                          return [name, field ? asStored(field, fieldValue) : fieldValue];
                      })
                  )
                : item;
        return Array.isArray(value) ? value.map(row) : row(value);
    }
    return value;
};

/**
 * Kept for callers that only have observations. Prefer letting `renderComponentText` merge with the
 * component's own manifest, which is what an instance does.
 */
export const propValuesFromObservations = (props: ObservedProp[]): Record<string, unknown> =>
    propsFromManifestAndObservations(
        props.map(p => ({ name: p.name, list: p.array, fields: p.fields })),
        props
    );

/** Markup to text: tags dropped, entities decoded, whitespace collapsed. */
const markupToText = (html: string): string =>
    html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/\s+/g, " ")
        .trim();

export const renderComponentText = (
    bundled: string,
    componentName: string,
    observed: ObservedProp[]
): string => renderComponentMarkup(bundled, componentName, observed).text;

/**
 * The same render, with the markup kept as well as its text.
 *
 * Text alone cannot show a value used wrongly in an attribute or a style: an image file input whose
 * object lands in `src` or in `url(...)` renders as `[object Object]` there, which leaves the text
 * untouched and the image blank.
 */
export const renderComponentMarkup = (
    bundled: string,
    componentName: string,
    observed: ObservedProp[]
): RenderedComponent => {
    try {
        // A fresh context with nothing in it, for the same reason `buildComponentManifest` uses one:
        // this is model-generated code derived from captured third-party pages.
        const sandbox = createContext(Object.create(null));

        const module = runInNewContext(
            `var __remoteComponent__; ${bundled}; __remoteComponent__;`,
            sandbox,
            { timeout: RENDER_TIMEOUT_MS }
        ) as {
            createComponent: (runtime: unknown) => {
                component?: React.ComponentType<Record<string, unknown>>;
                manifest?: Record<string, unknown>;
            };
        };

        const built = module.createComponent({
            version: "1",
            dependencies: { sdk: sdkStub, React },
            environment: { tenantId: "root", locale: "en-US", mode: "server" }
        });

        if (!built?.component) {
            throw new Error("The bundle produced no component.");
        }

        // The component's own declared inputs, with the observations laid over them.
        const manifestInputs = (built.manifest?.inputs as ManifestInput[] | undefined) ?? [];
        // The values the component ships with live under `defaults.inputs`, not on the inputs
        // themselves — a lexical body typically declares no defaultValue at all and carries its
        // paragraphs here. Ignoring them renders a component that is mostly empty.
        const manifestDefaults =
            (built.manifest?.defaults as { inputs?: Record<string, unknown> } | undefined)
                ?.inputs ?? {};
        const props = propsFromManifestAndObservations(manifestInputs, observed, manifestDefaults);

        // `renderToStaticMarkup` rather than `renderToString`: no hydration markers to strip back out.
        const markup = renderToStaticMarkup(
            React.createElement(built.component, {
                inputs: props,
                styles: {},
                element: { id: "validation" },
                breakpoint: "desktop"
            })
        );

        return { markup, text: markupToText(markup), files: fileValues(manifestInputs, props) };
    } catch (error) {
        throw new ComponentRenderError(componentName, error);
    }
};
