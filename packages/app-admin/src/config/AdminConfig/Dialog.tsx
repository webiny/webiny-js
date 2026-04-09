import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface DialogConfig {
    name: string;
    element: React.ReactElement;
}

export interface DialogProps {
    name: string;
    element: React.ReactElement;
}

export const Dialog = ({ name, element }: DialogProps) => {
    const getId = useIdGenerator("Dialog");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={getId(name)} name={"dialogs"} array={true} value={{ name, element }} />
        </ConnectToProperties>
    );
};
