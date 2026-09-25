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
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { createContext, runInNewContext } from "node:vm";

/**
 * The manifest's input descriptors — `{ name, factory: "createTextInput", params }` — name an SDK
 * factory rather than calling it, so the manifest stays serialisable inside the component's source.
 * Every factory is a pure data function with no React dependency
 * (`website-builder-sdk/src/createInput.ts`), which is what lets the API build a manifest at all.
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

/** Enough for a module-level declaration, far short of anything that loops. */
const EVALUATION_TIMEOUT_MS = 1000;

export class ManifestBuildError extends Error {
    constructor(componentName: string, cause: unknown) {
        super(
            `Could not build the manifest for "${componentName}": ${
                cause instanceof Error ? cause.message : String(cause)
            }`
        );
        this.name = "ManifestBuildError";
    }
}

/**
 * Builds a component's manifest **from its own bundle**, by calling the bundle's `createComponent`
 * with a stub runtime and keeping the manifest it hands back.
 *
 * The obvious alternative — evaluating just the manifest expression — is wrong, and measurably so:
 * a manifest may reference names declared at module scope in the component's source
 * (`defaultValue: BODY_DEFAULT`). In the bundle those are in scope, because the manifest is
 * evaluated inside the same wrapper as the component body. Evaluated on its own it throws
 * `BODY_DEFAULT is not defined` — 4 of 118 stored components do exactly this.
 *
 * Taking it from the bundle also makes the guarantee exact rather than close: what is persisted is
 * what the browser gets from `hydrateComponent`, because it is the same code producing it. The
 * component's function bodies are never invoked — only module-level declarations run, and the
 * generator forbids imports and `require` — so React is stubbed rather than provided.
 */
export const buildComponentManifest = (
    bundled: string,
    componentName: string
): ComponentManifest => {
    let manifest: Record<string, unknown>;

    try {
        // A fresh context with nothing in it, rather than `new Function`, which would run this with
        // the Lambda's own globals in scope — `process`, `fetch`, the AWS SDK's environment. The
        // source being executed is model-generated from captured third-party pages, so it is not
        // input we control end to end. The timeout bounds a module-level loop.
        const sandbox = createContext(Object.create(null));

        const module = runInNewContext(
            `var __remoteComponent__; ${bundled}; __remoteComponent__;`,
            sandbox,
            { timeout: EVALUATION_TIMEOUT_MS }
        ) as {
            createComponent: (runtime: unknown) => { manifest?: Record<string, unknown> };
        };

        const built = module.createComponent({
            version: "1",
            dependencies: {
                sdk: sdkStub,
                // Never called: only module-level declarations execute, and a component's body runs
                // when a page renders it, not here.
                React: { createElement: () => null, Fragment: null }
            },
            environment: { tenantId: "root", locale: "en-US", mode: "server" }
        });

        if (!built?.manifest) {
            throw new Error("The bundle produced no manifest.");
        }

        manifest = built.manifest;
    } catch (error) {
        throw new ManifestBuildError(componentName, error);
    }

    return {
        ...manifest,
        // The promoted name is what the page element records, and a collision rename at Promote makes
        // it differ from whatever the model wrote. The manifest has to agree with the element.
        name: componentName,
        tags: Array.isArray(manifest.tags) ? (manifest.tags as string[]) : []
    } as ComponentManifest;
};
