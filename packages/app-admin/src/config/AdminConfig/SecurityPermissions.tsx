import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface SecurityPermissionsProps {
    name: string;
    title: string;
    description?: string;
    icon?: React.ReactElement;
    element: React.ReactElement;
    system?: boolean;
}

export const SecurityPermissions = ({
    name,
    title,
    description,
    icon,
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
                value={{ name, title, description, icon, element, system }}
            />
        </ConnectToProperties>
    );
};
