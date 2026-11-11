import type React from "react";
import type { HostingType } from "./hostingType.js";
import { extensionImplementations } from "./extensionImplementations.js";

type ExtensionComponent = React.ComponentType<any> & { def?: { type: string } };

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
    extensionImplementations.set(key, implementation);

    return () => {
        extensionImplementations.delete(key);
    };
};
