import React, { Fragment } from "react";
import { useSecurity } from "~/hooks/useSecurity";

interface HasPermissionProps {
    any?: string[];
    all?: string[];
    name?: string;
    children: React.ReactNode;
}

export const HasPermission = ({ children, ...props }: HasPermissionProps) => {
    const { getPermissions } = useSecurity();

    if (props.name) {
        const permissionsCollections = getPermissions(props.name);
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

    const permissionsCollections = anyAllPermissions.map(name => getPermissions(name));

    const hasPermission = props.any
        ? permissionsCollections.some(collection => collection.length > 0)
        : permissionsCollections.every(collection => collection.length > 0);

    if (hasPermission) {
        return <Fragment>{children}</Fragment>;
    }

    return null;
};
