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

    // Multiple apps may contribute to the same permission group (same `name`), each
    // declaring only its own entities. If they all registered under the same id, the
    // last one would overwrite the others in the PropertyStore (same id => last write
    // wins). So we append the entity ids to make each registration's id unique — e.g.
    // "...:dev-tools:graphql-playground" vs "...:dev-tools:sdk-playground". They are
    // merged back together by `name` at render time (see `Permissions.tsx`).
    const entityIds = schema?.entities?.map(entity => entity.id) ?? [];

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name, ...entityIds)}
                name={"permissionRenderers"}
                array={true}
                value={{ name, title, description, icon, schema, element, system }}
            />
        </ConnectToProperties>
    );
};
