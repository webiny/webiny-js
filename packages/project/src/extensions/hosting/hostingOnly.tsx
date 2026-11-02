import React from "react";
import { getExtensionImplementation } from "./extensionImplementations.js";
import type { HostingType } from "./hostingType.js";

const HOSTING_TYPE_LABELS: Record<HostingType, string> = {
    aws: "AWS",
    standalone: "standalone"
};

/**
 * Restricts an extension to the given hosting types.
 *
 * `webiny/extensions` exposes one set of namespaces for every project, so `Infra.Vpc` can be
 * imported in a standalone project and `Infra.Sqlite` in an AWS one. Rendering either in the
 * wrong project throws, instead of the extension being skipped because the hosting package never
 * registered its definition.
 *
 * If the hosting package registered its own component for the extension, that component renders
 * in place of the given one (see `registerExtensionImplementation`).
 *
 * The current hosting type comes from `WEBINY_HOSTING_TYPE`, which the `webiny` bin of
 * `@webiny/cli-aws` and `@webiny/cli-standalone` sets. When it isn't set, nothing is checked.
 */
export function hostingOnly<TComponent extends React.ComponentType<any>>(
    name: string,
    hostingTypes: HostingType[],
    Component: TComponent
): TComponent {
    const HostingOnly = (props: React.ComponentProps<TComponent>) => {
        const current = process.env.WEBINY_HOSTING_TYPE;
        if (current && !hostingTypes.includes(current as HostingType)) {
            const supported = hostingTypes.map(type => HOSTING_TYPE_LABELS[type]).join(" and ");
            throw new Error(
                `"${name}" is only available in ${supported} projects. This project's hosting type is "${current}".`
            );
        }

        const Implementation = getExtensionImplementation(Component) ?? Component;
        return <Implementation {...props} />;
    };

    // Keep `def` and `getDefinition` reachable, the same as on the wrapped extension.
    Object.assign(HostingOnly, Component);
    HostingOnly.displayName = `HostingOnly(${name})`;

    return HostingOnly as unknown as TComponent;
}

export const awsOnly = <TComponent extends React.ComponentType<any>>(
    name: string,
    Component: TComponent
) => hostingOnly(name, ["aws"], Component);

export const standaloneOnly = <TComponent extends React.ComponentType<any>>(
    name: string,
    Component: TComponent
) => hostingOnly(name, ["standalone"], Component);

/**
 * For extensions that every hosting type supports, but where a hosting package may render its own
 * component, e.g. `Infra.Crypto.Encryption` on standalone.
 */
export const anyHosting = <TComponent extends React.ComponentType<any>>(
    name: string,
    Component: TComponent
) => hostingOnly(name, ["aws", "standalone"], Component);
