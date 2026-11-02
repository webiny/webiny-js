import type React from "react";
import type { HostingType } from "./hostingType.js";

type ExtensionComponent = React.ComponentType<any> & { def?: { type: string } };

/**
 * Some extensions in the shared namespaces need hosting-specific code when they render. For
 * example, `Infra.OpenSearch` renders Pulumi hooks that live in `@webiny/project-aws`, and the
 * standalone `Infra.Encryption` sets env vars where the AWS one sets build params. The hosting
 * package registers its component for the extension type here, and the shared namespace renders
 * it in projects of that hosting type (see `hostingOnly`).
 *
 * Keyed by hosting type and extension type, so a spec and its implementation match even if they
 * come from separate copies of `@webiny/project`.
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
    hostingType: HostingType,
    spec: ExtensionComponent,
    implementation: React.ComponentType<any>
) => {
    implementations.set(`${hostingType}:${getType(spec)}`, implementation);
};

export const getExtensionImplementation = (spec: ExtensionComponent) => {
    const hostingType = process.env.WEBINY_HOSTING_TYPE;
    const type = spec.def?.type;
    if (!hostingType || !type) {
        return undefined;
    }
    return implementations.get(`${hostingType}:${type}`);
};
