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
                        firstUseful(values) ??
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
        inputs.filter(input => input.name).map(input => [input.name, valueFor(input)])
    );
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
): { markup: string; text: string } => {
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

        return { markup, text: markupToText(markup) };
    } catch (error) {
        throw new ComponentRenderError(componentName, error);
    }
};
