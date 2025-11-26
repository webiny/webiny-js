import React from "react";
import { ConnectToProperties, Property } from "@webiny/react-properties";

export interface WidgetConfig {
    name: string;
    element: React.ReactElement;
    column?: 1 | 2;
    order?: number;
}

export interface WidgetProps {
    name: string;
    column?: 1 | 2;
    order?: number;
    element: React.ReactElement;
}

export const Widget = ({ name, element, column = 1, order = 0 }: WidgetProps) => {
    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={name}
                name={"widgets"}
                array={true}
                value={{ name, element, column, order }}
            />
        </ConnectToProperties>
    );
};
