import React, { Fragment } from "react";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";

interface HasPermissionProps {
    any?: string[];
    all?: string[];
    name?: string;
    children: React.ReactNode;
}

export const HasPermission = ({ children, ...props }: HasPermissionProps) => {
    const { identity } = useAuthentication();

    if (props.name) {
        const permissionsCollections = identity.getPermissions(props.name);
        const hasPermission = permissionsCollections.length > 0;
        if (hasPermission) {
            return <Fragment>{children}</Fragment>;
        }

        return null;
    }

    if (props.any && props.all) {
        throw new Error(`You can use either "any" or "all", but not both at the same time.`);
    }

    const anyAllPermissions = props.any || props.all || [];

    const permissionsCollections = anyAllPermissions.map(name => identity.getPermissions(name));

    const hasPermission = props.any
        ? permissionsCollections.some(collection => collection.length > 0)
        : permissionsCollections.every(collection => collection.length > 0);

    if (hasPermission) {
        return <Fragment>{children}</Fragment>;
    }

    return null;
};
