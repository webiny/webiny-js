import {
    createBooleanInput,
    createColorInput,
    createDateInput,
    createFileInput,
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
import type { ComponentInput, ComponentManifest } from "@webiny/website-builder-sdk";
import { PageCompositionError } from "~/domain/errors.js";

/**
 * The same anchor `@webiny/remote-components`' bundler uses to find the manifest
 * (`api/bundler/bundleComponent.ts`): the generator is told to end the manifest with `};` on its own
 * line, and a component whose manifest this misses would not have bundled either.
 */
const MANIFEST_PATTERN = /export\s+const\s+manifest\s*=\s*(\{[\s\S]*?\n\};?)/;

/**
 * The manifest's `inputs` are declarative descriptors — `{ name, factory: "createTextInput", params }`
 * — that name an SDK factory rather than calling it, so the manifest stays serialisable in the
 * component's source. Every factory here is a pure data function with no React dependency
 * (`website-builder-sdk/src/createInput.ts`), which is what makes this possible on the API at all.
 */
/**
 * Each factory demands its own parameter shape — a select needs `options`, a file needs
 * `allowedFileTypes` — while what arrives here is a parsed object literal with no static type at all.
 * The table is therefore keyed on the one thing they share, and the parameter stays `any`: a
 * descriptor whose params don't satisfy its factory is a generator bug, and it surfaces as a throw
 * from the factory rather than as a silently wrong input.
 */
type InputFactory = (input: any) => ComponentInput;

const FACTORIES: Record<string, InputFactory> = {
    createBooleanInput,
    createColorInput,
    createDateInput,
    createFileInput,
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

interface InputDescriptor {
    name?: string;
    factory?: string;
    params?: Record<string, unknown>;
    /** Present when the entry is already a built input rather than a descriptor. */
    type?: string;
}

const isDescriptor = (value: unknown): value is InputDescriptor =>
    typeof value === "object" && value !== null;

/**
 * Turns one descriptor into a real input, recursing through `params.fields` so nested object inputs
 * (a list of cards, a button's label + url) are built too.
 *
 * The bundler's own rewrite is a regex over the manifest text whose `params` group cannot match
 * nested braces, so it silently leaves a nested descriptor unbuilt. Walking the parsed object avoids
 * that — one of the reasons this is a reimplementation rather than a copy.
 */
const toInput = (entry: unknown): ComponentInput | null => {
    if (!isDescriptor(entry)) {
        return null;
    }

    // Already a built input (no factory to apply) — take it as it stands.
    if (!entry.factory && entry.type) {
        return entry as unknown as ComponentInput;
    }

    const factory = entry.factory ? FACTORIES[entry.factory] : undefined;
    if (!factory || !entry.name) {
        return null;
    }

    const params = { ...(entry.params ?? {}) };
    if (Array.isArray(params.fields)) {
        params.fields = params.fields.map(toInput).filter(Boolean);
    }

    return factory({ ...params, name: entry.name });
};

/**
 * Recovers a component's `ComponentManifest` from its stored source.
 *
 * PROOF OF CONCEPT. `wbyRemoteComponent` persists no manifest, and the only supported way to obtain
 * one is to execute the component's bundle in a browser with React present
 * (`sdk-frontend/src/ComponentsSdk.ts`, `hydrateComponent`). The API-side extraction and descriptor
 * normalisation in `@webiny/remote-components` are module-private, so this reimplements the
 * equivalent for the manifest literal alone — the component body is never evaluated, only the
 * object literal the generator was required to export.
 */
export const extractComponentManifest = (source: string, name: string): ComponentManifest => {
    const match = source.match(MANIFEST_PATTERN);
    if (!match?.[1]) {
        throw new PageCompositionError(`Could not find a manifest in the source of "${name}".`, {
            component: name
        });
    }

    const literal = match[1].replace(/;\s*$/, "");

    let parsed: Record<string, unknown>;
    try {
        parsed = new Function(`return (${literal});`)() as Record<string, unknown>;
    } catch (error) {
        throw new PageCompositionError(`The manifest of "${name}" is not a valid object literal.`, {
            component: name,
            cause: error instanceof Error ? error.message : String(error)
        });
    }

    const descriptors = Array.isArray(parsed.inputs) ? parsed.inputs : [];
    const inputs = descriptors.map(toInput).filter((input): input is ComponentInput => !!input);

    return {
        ...parsed,
        // The element records the promoted name, so the manifest must agree with it rather than with
        // whatever the model wrote — a collision rename at Promote makes the two differ.
        name,
        inputs,
        tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : []
    } as ComponentManifest;
};
