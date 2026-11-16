import React from "react";
import type { HostingType } from "@webiny/project/extensions/hosting/index.js";

type HostingVersions = Record<HostingType, React.ComponentType<any>>;

/*
 * The props of every hosting type's version, as a union: `Infra.Postgres` takes the standalone
 * connection props (`host`, `password`, …) in a standalone project and the AWS capacity props in
 * an AWS one, and each set type-checks on its own.
 */
type HostingSwitchProps<TVersions extends HostingVersions> =
    TVersions[HostingType] extends infer TVersion
        ? TVersion extends React.ComponentType<infer TProps>
            ? TProps
            : never
        : never;

/**
 * A namespace member for an extension that has a different version per hosting type, such as
 * `Infra.Crypto.Encryption`: the AWS version passes the secrets as build params, the standalone
 * version as env vars. Renders the version for `WEBINY_HOSTING_TYPE`, or the `fallback` hosting
 * type's version when the variable isn't set.
 */
export const createHostingSwitch = <TVersions extends HostingVersions>(
    versions: TVersions,
    fallback: HostingType
) => {
    const HostingSwitch = (props: HostingSwitchProps<TVersions>) => {
        const current = process.env.WEBINY_HOSTING_TYPE as HostingType | undefined;
        const Version = (current && versions[current]) || versions[fallback];
        // Each version gets the props of its own hosting type, which the union above includes.
        return <Version {...(props as object)} />;
    };

    return HostingSwitch;
};
