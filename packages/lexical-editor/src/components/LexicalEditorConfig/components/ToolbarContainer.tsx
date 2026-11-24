import React from "react";
import { Property } from "@webiny/react-properties";

export type ToolbarContainerType = "static" | "floating";

export interface ToolbarContainerConfig {
    type: ToolbarContainerType;
    element: React.ReactElement;
}

export interface ToolbarContainerProps {
    /** `static`: a band above the text. `floating`: a panel over the selected text. */
    type: ToolbarContainerType;
    /** The container, e.g. `<StaticToolbar />` or `<FloatingToolbar />`; it shows the toolbar elements. */
    element: React.ReactElement<unknown>;
}

/**
 * Where the toolbar elements are shown. When it's set, it takes the place of the editor's
 * `staticToolbar` and `toolbar` props.
 */
export const ToolbarContainer = ({ type, element }: ToolbarContainerProps) => {
    return (
        <Property id={"toolbarContainer"} name={"toolbarContainer"}>
            <Property id={"toolbarContainer:type"} name={"type"} value={type} />
            <Property id={"toolbarContainer:element"} name={"element"} value={element} />
        </Property>
    );
};
