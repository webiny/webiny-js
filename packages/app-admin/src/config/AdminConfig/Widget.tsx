import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export type WidgetColumn = "left" | "right";

export interface WidgetConfig {
    name: string;
    element: React.ReactElement;
    column?: WidgetColumn;
    pin?: "first" | "last";
    // Human-readable label, shown e.g. in the "Add widget" drawer when the widget is hidden.
    title?: string;
    // One-line summary, shown under the title in the "Add widget" drawer.
    description?: string;
    // Heading the widget is listed under in the "Add widget" drawer, usually the app name.
    group?: string;
}

export interface WidgetProps {
    name: string;
    element: React.ReactElement;
    column?: WidgetColumn;
    pin?: "first" | "last";
    title?: string;
    description?: string;
    group?: string;
}

export const Widget = ({
    name,
    element,
    column = "left",
    pin,
    title,
    description,
    group
}: WidgetProps) => {
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
                value={{ name, element, column, pin, title, description, group }}
            />
        </ConnectToProperties>
    );
};
