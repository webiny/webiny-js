import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { evaluateBundle } from "./evaluateBundle.js";
import { ManifestBuildError } from "./ManifestBuildError.js";
import { loadSdkStub } from "./sdkStub.js";

/** Enough for module-level declarations, far short of anything that loops. */
const EVALUATION_TIMEOUT_MS = 1000;

/**
 * Builds a component's manifest from its own bundle, by calling the bundle's `createComponent` with a
 * stub runtime and keeping the manifest it hands back.
 *
 * Evaluating the manifest expression on its own would be wrong: a manifest may reference names
 * declared at module scope (`defaultValue: BODY_DEFAULT`), which are only in scope inside the bundle.
 * Taken from the bundle, the manifest is exactly what a page gets at runtime. The component function
 * is never called, so React is stubbed rather than provided.
 */
export async function buildComponentManifest(
    bundled: string,
    componentName: string
): Promise<ComponentManifest> {
    const sdkStub = await loadSdkStub();
    let manifest: Record<string, unknown>;

    try {
        const module = evaluateBundle(bundled, EVALUATION_TIMEOUT_MS);

        const built = module.createComponent({
            version: "1",
            dependencies: {
                sdk: sdkStub,
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

    const tags = Array.isArray(manifest.tags) ? manifest.tags : [];

    // The stored component's name is what page elements record, so the manifest carries it.
    const result: ComponentManifest = {
        ...manifest,
        name: componentName,
        tags
    } as ComponentManifest;

    return result;
}
