/**
 * The bundler's input and output shapes. They live in `shared` because both the server bundler and
 * the editor's preview bundler produce them, and neither layer owns the other.
 */
export interface ComponentSource {
    name: string;
    source: string;
    css?: string;
}

/**
 * What the bundler produces and persists. There is one producer: the server. The editor used to hold
 * a second bundler, which existed only to feed its save path — once saving was routed through
 * `bundleRemoteComponent` it had no caller, and a module kept for a reason that no longer holds is
 * worse than no module.
 *
 * The manifest is stored beside the bundle it was built from, so consumers get a component's inputs
 * as data rather than executing the bundle in a browser to recover them.
 */
export interface BundledComponent {
    name: string;
    source: string;
    bundled: string;
    sha256: string;
    css?: string;
    cssSha256?: string;
    manifest: string;
}

/**
 * A bundle that has already been built, handed to a create or update so the component is stored
 * placeable in one step.
 *
 * Only Promote supplies this: it bundles before it writes anything, so a component that cannot be
 * bundled never enters the Library. Neither `CreateRemoteComponentInput` nor
 * `UpdateRemoteComponentInput` in the GraphQL schema has a field for it, so the editor still cannot
 * produce a bundle — it asks the server to build one.
 */
export interface PrebuiltBundle {
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
    manifest: string;
}
