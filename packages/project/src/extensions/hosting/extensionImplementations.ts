import type React from "react";

type ExtensionComponent = React.ComponentType<any> & { def?: { type: string } };

/**
 * Some extensions in the shared namespaces only need hosting-specific code when they render. For
 * example, `Infra.OpenSearch` renders Pulumi hooks that live in `@webiny/project-aws`. The shared
 * package holds a spec of such an extension (type and params), and the hosting package registers
 * the full component here. The `hostingOnly` wrapper renders the registered component in place of
 * the spec.
 *
 * Keyed by extension type, so a spec and its implementation match even if they come from separate
 * copies of `@webiny/project`.
 */
const implementations = new Map<string, React.ComponentType<any>>();

const getType = (component: ExtensionComponent) => {
    const type = component.def?.type;
    if (!type) {
        throw new Error(
            `Only components created with "defineExtension" can have a registered implementation.`
        );
    }
    return type;
};

export const registerExtensionImplementation = (
    spec: ExtensionComponent,
    implementation: React.ComponentType<any>
) => {
    implementations.set(getType(spec), implementation);
};

export const getExtensionImplementation = (spec: ExtensionComponent) => {
    const type = spec.def?.type;
    return type ? implementations.get(type) : undefined;
};
