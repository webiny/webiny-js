import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface DrawerConfig {
    name: string;
    element: React.ReactElement;
}

export interface DrawerProps {
    name: string;
    element: React.ReactElement;
}

export const Drawer = ({ name, element }: DrawerProps) => {
    const getId = useIdGenerator("Drawer");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={getId(name)} name={"drawers"} array={true} value={{ name, element }} />
        </ConnectToProperties>
    );
};
