import type React from "react";
import type { HostingType } from "./hostingType.js";

type ExtensionComponent = React.ComponentType<any> & { def?: { type: string } };

/**
 * Some extensions need hosting-specific code when they render. For example, `Infra.OpenSearch`
 * renders Pulumi hooks that live in `@webiny/project-aws`, and the standalone
 * `Infra.Crypto.Encryption` sets env vars where the AWS one sets build params. The hosting package
 * registers its component for the extension type here, and every component created with
 * `defineExtension` for that type renders the registered one in projects of that hosting type.
 *
 * Keyed by hosting type and extension type: a type can have a registered implementation in one
 * hosting type and none in the other, e.g. `Infra/Encryption` in standalone only.
 */
const implementations = new Map<string, React.ComponentType<any>>();

/**
 * Returns a function that removes the registration again.
 */
export const registerExtensionImplementation = (
    hostingType: HostingType,
    spec: ExtensionComponent,
    implementation: React.ComponentType<any>
) => {
    const type = spec.def?.type;
    if (!type) {
        throw new Error(
            `Only components created with "defineExtension" can have a registered implementation.`
        );
    }
    const key = `${hostingType}:${type}`;
    implementations.set(key, implementation);

    return () => {
        implementations.delete(key);
    };
};

export const getExtensionImplementation = (type: string) => {
    const hostingType = process.env.WEBINY_HOSTING_TYPE;
    if (!hostingType) {
        return undefined;
    }
    return implementations.get(`${hostingType}:${type}`);
};
