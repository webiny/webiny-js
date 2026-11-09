import type React from "react";

/**
 * Some extensions need hosting-specific code when they render. For example, `Infra.OpenSearch`
 * renders Pulumi hooks that live in `@webiny/project-aws`, and the standalone
 * `Infra.Crypto.Encryption` sets env vars where the AWS one sets build params. The hosting package
 * registers its component for the extension type (`registerExtensionImplementation`), and every
 * component created with `defineExtension` for that type renders the registered one in projects
 * of that hosting type (`getExtensionImplementation`).
 *
 * Keyed by hosting type and extension type: a type can have a registered implementation in one
 * hosting type and none in the other, e.g. `Infra/Encryption` in standalone only.
 */
export const extensionImplementations = new Map<string, React.ComponentType<any>>();
