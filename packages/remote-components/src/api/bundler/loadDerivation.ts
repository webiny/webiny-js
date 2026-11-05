type DerivationModule = typeof import("~/shared/bundler/deriveComponentBundle.js");

/**
 * The derivation is imported on first use, like esbuild: it brings acorn and css-tree, which only
 * bundling and bundle validation need, and every API bundle that includes this package would
 * otherwise carry them.
 */
export function loadDerivation(): Promise<DerivationModule> {
    return import("~/shared/bundler/deriveComponentBundle.js");
}
