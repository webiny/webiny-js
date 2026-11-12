import React from "react";
import type { HostingType } from "@webiny/project/extensions/hosting/index.js";

/**
 * A namespace member for an extension that has a different version per hosting type, such as
 * `Infra.Crypto.Encryption`: the AWS version passes the secrets as build params, the standalone
 * version as env vars. Renders the version for `WEBINY_HOSTING_TYPE`, or the `fallback` hosting
 * type's version when the variable isn't set.
 */
export const createHostingSwitch = <TProps extends object>(
    versions: Record<HostingType, React.ComponentType<TProps>>,
    fallback: HostingType
) => {
    const HostingSwitch = (props: TProps) => {
        const current = process.env.WEBINY_HOSTING_TYPE as HostingType | undefined;
        const Version = (current && versions[current]) || versions[fallback];
        return <Version {...props} />;
    };

    return HostingSwitch;
};
