import type { ComponentBundle, ComponentSource, ValidationResult } from "./types.js";
import { validateComponentSource } from "./validateComponentSource.js";
import { buildComponentManifest } from "./buildComponentManifest.js";
import { outlineManifestInputs } from "./outlineManifestInputs.js";
import { stableStringify } from "./stableStringify.js";
import { errorMessage } from "./errorMessage.js";
import { loadDerivation } from "./loadDerivation.js";

/**
 * Checks a bundle built outside the API against the component it is stored with, without bundling
 * again (no esbuild is loaded):
 *
 * - the bundle evaluates and produces a manifest, and that manifest is the one supplied;
 * - the manifest declares the inputs the source declares, by name, at every depth;
 * - the bundle's CSS is exactly the scoped CSS the component's CSS derives to, and absent when the
 *   component has none. The derivation is deterministic, so anything else isn't the component's CSS.
 */
export async function validateComponentBundle(
    component: ComponentSource,
    bundle: ComponentBundle
): Promise<ValidationResult> {
    const sourceValidation = validateComponentSource(component.source);
    if (!sourceValidation.valid) {
        return sourceValidation;
    }

    const errors: string[] = [];

    const { deriveComponentBundle } = await loadDerivation();

    let derivation;
    try {
        derivation = deriveComponentBundle(component);
    } catch (error) {
        return { valid: false, errors: [errorMessage(error)] };
    }

    let builtManifest;
    try {
        builtManifest = await buildComponentManifest(bundle.bundledJs, component.name);
    } catch (error) {
        return { valid: false, errors: [errorMessage(error)] };
    }

    let suppliedManifest: unknown;
    try {
        suppliedManifest = JSON.parse(bundle.manifest);
    } catch {
        errors.push("The bundle's `manifest` is not valid JSON.");
    }

    if (
        suppliedManifest !== undefined &&
        stableStringify(suppliedManifest) !== stableStringify(builtManifest)
    ) {
        errors.push("The bundle's `manifest` is not the manifest `bundledJs` produces.");
    }

    const sourceInputs = stableStringify(derivation.inputs);
    const bundleInputs = stableStringify(outlineManifestInputs(builtManifest.inputs));
    if (sourceInputs !== bundleInputs) {
        errors.push("The bundle's manifest does not declare the inputs the source declares.");
    }

    const expectedCss = derivation.css ?? "";
    const bundledCss = bundle.bundledCss ?? "";
    if (expectedCss && !bundledCss) {
        errors.push("The component has CSS, but the bundle has no `bundledCss`.");
    } else if (!expectedCss && bundledCss) {
        errors.push("The component has no CSS, but the bundle has `bundledCss`.");
    } else if (bundledCss !== expectedCss) {
        errors.push("The bundle's CSS is not the component's CSS, scoped to its scope class.");
    }

    return { valid: errors.length === 0, errors };
}
