import { scopeClassName } from "~/shared/bundler/scopeClassName.js";
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
 * - when the component has CSS, the bundle's CSS is scoped to the component's scope class.
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

    // Only rules that scoping touches carry the class; CSS of `:root` rules alone has none.
    const scope = `.${scopeClassName(component.name)} `;
    const bundledCss = bundle.bundledCss ?? "";
    if (derivation.css && !bundledCss.trim()) {
        errors.push("The component has CSS, but the bundle has no `bundledCss`.");
    } else if (derivation.css?.includes(scope) && !bundledCss.includes(scope)) {
        errors.push(`The bundle's CSS is not scoped to "${scope.trim()}".`);
    }

    return { valid: errors.length === 0, errors };
}
