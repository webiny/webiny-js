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
    /*
     * A static stand-in for the widget, shown scaled down in the "Add widget" drawer. Use sample
     * data and no requests: the drawer renders every preview at once, and the user may not have
     * access to what the widget shows.
     */
    preview?: React.ReactElement;
}

export interface WidgetProps {
    name: string;
    element: React.ReactElement;
    column?: WidgetColumn;
    pin?: "first" | "last";
    title?: string;
    description?: string;
    group?: string;
    preview?: React.ReactElement;
}

export const Widget = ({
    name,
    element,
    column = "left",
    pin,
    title,
    description,
    group,
    preview
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
                value={{ name, element, column, pin, title, description, group, preview }}
            />
        </ConnectToProperties>
    );
};
