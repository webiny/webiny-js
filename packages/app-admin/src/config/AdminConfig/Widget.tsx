import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export type WidgetColumn = "left" | "right";

export interface WidgetConfig {
    name: string;
    element: React.ReactElement;
    column?: WidgetColumn;
    pin?: "first" | "last";
}

export interface WidgetProps {
    name: string;
    element: React.ReactElement;
    column?: WidgetColumn;
    pin?: "first" | "last";
}

export const Widget = ({ name, element, column = "left", pin }: WidgetProps) => {
    const getId = useIdGenerator("DashboardWidget");

    let placeAfter: string | undefined;
    let placeBefore: string | undefined;

    if (pin) {
        if (pin === "first") {
            placeBefore = "$first";
        } else if (pin === "last") {
            placeAfter = "$last";
        }
    }

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"widgets"}
                array={true}
                before={placeBefore}
                after={placeAfter}
                value={{ name, element, column, pin }}
            />
        </ConnectToProperties>
    );
};
