export type { ComponentSource, InputOutline } from "~/shared/bundler/types.js";

export interface BundledComponent {
    name: string;
    source: string;
    bundled: string;
    sha256: string;
    css?: string;
    cssSha256?: string;
    /** The manifest the bundle produces, as JSON. Pass it with the bundle to `createRemoteComponent`. */
    manifest: string;
}

/**
 * A bundle built outside the API, handed to `createRemoteComponent` or `updateRemoteComponent` so the
 * component is stored with it instead of being bundled there. `bundledJs` and `bundledCss` are what
 * `bundleComponent` returns as `bundled` and `css`.
 */
export interface ComponentBundle {
    bundledJs: string;
    bundledCss?: string | null;
    manifest: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
