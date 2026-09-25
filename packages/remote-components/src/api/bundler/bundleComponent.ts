import { createHash } from "node:crypto";
import type { ComponentSource, BundledComponent } from "./types.js";
import { validateComponentSource } from "./validateComponentSource.js";
import { loadEsbuild } from "./esbuildWasm.js";
import { deriveComponentBundle, ESBUILD_OPTIONS } from "~/shared/bundler/deriveComponentBundle.js";
import { buildComponentManifest } from "./buildComponentManifest.js";

export { scopeClassName } from "~/shared/bundler/scopeClassName.js";

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

/**
 * The server bundler. Everything about *what* to bundle lives in `deriveComponentBundle`, shared
 * with the editor's preview bundler; this adds only what is specific to running on the server —
 * esbuild off the shipped wasm asset, and Node's hashing.
 */
export async function bundleComponent(component: ComponentSource): Promise<BundledComponent> {
    const validation = validateComponentSource(component.source);

    if (!validation.valid) {
        throw new Error(
            `Invalid component source for "${component.name}":\n${validation.errors.join("\n")}`
        );
    }

    const { build } = await loadEsbuild();
    const derivation = deriveComponentBundle(component);

    const result = await build({
        stdin: { contents: derivation.wrappedSource, loader: "jsx" },
        ...ESBUILD_OPTIONS
    });

    const bundled = result.outputFiles![0].text;

    const manifest = buildComponentManifest(bundled, component.name);

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
