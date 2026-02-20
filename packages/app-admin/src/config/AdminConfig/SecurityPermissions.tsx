import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import type { PermissionSchema } from "~/permissions/types.js";

export type SecurityPermissionsProps = SecurityPermissionsPropsBase &
    (
        | { schema: PermissionSchema; element?: never }
        | { schema?: never; element: React.ReactElement }
    );

export interface SecurityPermissionsPropsBase {
    name: string;
    title: string;
    description?: string;
    icon?: React.ReactElement;
    system?: boolean;
}

export const SecurityPermissions = ({
    name,
    title,
    description,
    icon,
    schema,
    element,
    system
}: SecurityPermissionsProps) => {
    const getId = useIdGenerator("SecurityPermissions");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"permissionRenderers"}
                array={true}
                value={{ name, title, description, icon, schema, element, system }}
            />
        </ConnectToProperties>
    );
};
