import { createHash } from "node:crypto";
import type { ComponentSource, BundledComponent } from "./types.js";
import { validateComponentSource } from "./validateComponentSource.js";
import { loadEsbuild } from "./esbuildWasm.js";
import { buildComponentManifest } from "./buildComponentManifest.js";
import { loadDerivation } from "./loadDerivation.js";

function sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

/**
 * Bundles a component's source with esbuild-wasm. Deterministic: the same source, CSS and name give
 * the same bundle, so callers outside the API can bundle and hand the result to
 * `createRemoteComponent`. What to bundle is derived by `deriveComponentBundle`; this adds esbuild,
 * hashing and the manifest.
 */
export async function bundleComponent(component: ComponentSource): Promise<BundledComponent> {
    const validation = validateComponentSource(component.source);

    if (!validation.valid) {
        throw new Error(
            `Invalid component source for "${component.name}":\n${validation.errors.join("\n")}`
        );
    }

    const { build } = await loadEsbuild();
    const { deriveComponentBundle, ESBUILD_OPTIONS } = await loadDerivation();
    const derivation = deriveComponentBundle(component);

    const result = await build({
        stdin: { contents: derivation.wrappedSource, loader: "jsx" },
        ...ESBUILD_OPTIONS
    });

    const bundled = result.outputFiles![0].text;
    const manifest = await buildComponentManifest(bundled, component.name);

    return {
        name: component.name,
        source: component.source,
        bundled,
        sha256: sha256(bundled),
        css: derivation.css ?? undefined,
        cssSha256: derivation.css ? sha256(derivation.css) : undefined,
        manifest: JSON.stringify(manifest)
    };
}

export async function bundleComponents(components: ComponentSource[]): Promise<BundledComponent[]> {
    return Promise.all(components.map(component => bundleComponent(component)));
}
