import type React from "react";

/**
 * Some extensions need code from a hosting package when they render. For example,
 * `Infra.OpenSearch` renders infrastructure hooks that live in `@webiny/project-aws`, which the
 * shared namespaces can't depend on. The hosting package registers its component for the extension
 * type (`registerExtensionImplementation`), and every component created with `defineExtension` for
 * that type renders the registered one in projects of that hosting type
 * (`getExtensionImplementation`).
 *
 * Keyed by hosting type and extension type: a type can have a registered implementation in one
 * hosting type and none in the other, e.g. `Project/OpenSearch` in AWS only.
 */
export const extensionImplementations = new Map<string, React.ComponentType<any>>();
