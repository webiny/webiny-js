/*
 * The component bundler, for Node callers outside the API (for example a service that generates
 * components and creates them with a `bundle`). Server only: it loads esbuild-wasm from the gzipped
 * asset shipped next to the bundler, and evaluates bundles with `node:vm`.
 */
export {
    bundleComponent,
    bundleComponents,
    validateComponentSource,
    validateComponentBundle,
    buildComponentManifest,
    renderComponentMarkup,
    scopeClassName,
    ManifestBuildError,
    ComponentRenderError
} from "~/api/bundler/index.js";
export type {
    ComponentSource,
    BundledComponent,
    ComponentBundle,
    InputOutline,
    ValidationResult,
    ObservedProp,
    RenderedComponent,
    RenderedFile
} from "~/api/bundler/index.js";
