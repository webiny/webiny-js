import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ComponentRenderError } from "./ComponentRenderError.js";
import { runBundle } from "./runBundle.js";
import { loadSdkStub } from "./sdkStub.js";

/** Enough for a render; far short of anything that loops. */
const RENDER_TIMEOUT_MS = 2000;

/**
 * A value to render an input with: the strings seen for it and, for object inputs, its fields.
 * Inputs without one render with the component's own defaults.
 */
export interface ObservedProp {
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
 * them where an observation exists, the way a placed instance merges its values over the defaults.
 * Without the defaults, inputs with no observation render empty or crash on a null.
 */
const propsFromManifestAndObservations = (
    inputs: ManifestInput[],
    observed: ObservedProp[],
    manifestDefaults: Record<string, unknown> = {}
): Record<string, unknown> => {
    const observedByName = new Map(observed.map(prop => [prop.name, prop]));

    const valueFor = (input: ManifestInput): unknown => {
        const match = observedByName.get(input.name ?? "");

        // An image's value comes from the component's own defaults, never from observations: text
        // observed for an image is its alt text, not a URL.
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
                                return [
                                    field.name,
                                    row?.[field.name ?? ""] ?? field.defaultValue ?? ""
                                ];
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
                    field.type === "file"
                        ? [urlOf((row as Record<string, unknown>)?.[field.name ?? ""])]
                        : []
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
                visit(
                    field,
                    (row as Record<string, unknown>)?.[field.name ?? ""],
                    fieldPath,
                    inList || Array.isArray(value)
                );
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
 * component can read whatever shape it wrote. For example a default of `{ url, src }` and a
 * component reading `.src`, which renders here and goes blank the moment an editor picks a different
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

const NAMED_ENTITIES: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"'
};

/**
 * Decodes the entities `renderToStaticMarkup` writes, in one pass, so a decoded `&` never starts
 * another entity: `&amp;lt;` is the text `&lt;`, not `<`.
 */
const decodeEntities = (text: string): string =>
    text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(nbsp|amp|lt|gt|quot));/gi, (entity, dec, hex, name) => {
        if (dec) {
            return String.fromCharCode(Number(dec));
        }
        if (hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }
        return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
    });

/** Markup to text: tags dropped, entities decoded, whitespace collapsed. */
const markupToText = (html: string): string => {
    const withoutTags = html.replace(/<[^>]*>/g, " ");
    const decoded = decodeEntities(withoutTags);

    return decoded.replace(/\s+/g, " ").trim();
};

interface BuiltComponent {
    component?: React.ComponentType<Record<string, unknown>>;
    manifest?: Record<string, unknown>;
}

/** Runs inside the context: builds the component and hands it to the host's render, in one script. */
const RENDER = `__host.render(__remoteComponent__.createComponent(__host.runtime))`;

/**
 * Renders a bundled component on the server with the given values applied, and returns its markup,
 * the text in it, and the URLs its file inputs were given. It answers whether a component, given its
 * values, puts the expected content on the page, which its source alone cannot: a parameterised
 * component's text arrives as props. The markup also shows a value used wrongly in an attribute or a
 * style, such as a file input's object rendered as `src="[object Object]"`.
 *
 * Building the component and rendering it run as one `node:vm` script under one timeout. The bundle
 * gets the host's React and input factories, so this is not isolated from the host: render only
 * bundles you would run in-process anyway, or call it from a separate process. The API itself never
 * calls it.
 */
export async function renderComponentMarkup(
    bundled: string,
    componentName: string,
    observed: ObservedProp[]
): Promise<RenderedComponent> {
    const sdkStub = await loadSdkStub();

    const render = (built: BuiltComponent | undefined): RenderedComponent => {
        const component = built?.component;
        if (!component) {
            throw new Error("The bundle produced no component.");
        }

        // The component's own declared inputs, with the observations laid over them.
        const manifestInputs = (built.manifest?.inputs as ManifestInput[] | undefined) ?? [];
        // The values the component ships with live under `defaults.inputs`, not on the inputs
        // themselves; a lexical input typically declares no defaultValue and carries its content here.
        const manifestDefaults =
            (built.manifest?.defaults as { inputs?: Record<string, unknown> } | undefined)
                ?.inputs ?? {};
        const props = propsFromManifestAndObservations(manifestInputs, observed, manifestDefaults);

        // `renderToStaticMarkup` rather than `renderToString`: no hydration markers to strip back out.
        const markup = renderToStaticMarkup(
            React.createElement(component, {
                inputs: props,
                styles: {},
                element: { id: "validation" },
                breakpoint: "desktop"
            })
        );

        return { markup, text: markupToText(markup), files: fileValues(manifestInputs, props) };
    };

    const host = {
        runtime: {
            version: "1",
            dependencies: { sdk: sdkStub, React },
            environment: { tenantId: "root", locale: "en-US", mode: "server" }
        },
        render
    };

    try {
        const rendered = runBundle(bundled, RENDER, { __host: host }, RENDER_TIMEOUT_MS);
        return rendered as RenderedComponent;
    } catch (error) {
        throw new ComponentRenderError(componentName, error);
    }
}
