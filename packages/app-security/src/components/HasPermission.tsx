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

    if (props.any && props.all) {
        throw new Error(`You can use either "any" or "all", but not both at the same time.`);
    }

    if (props.name) {
        return getPermissions(props.name) ? <Fragment>{children}</Fragment> : null;
    }

    const permissions = [...(props.any || []), ...(props.all || [])].map(name =>
        getPermissions(name)
    );

    const hasPermission = props.any
        ? permissions.some(p => Boolean(p))
        : permissions.every(p => Boolean(p));

    return hasPermission ? <Fragment>{children}</Fragment> : null;
};
