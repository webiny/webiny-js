import React from "react";
import { Property } from "@webiny/react-properties";

export interface ToolbarElementConfig {
    name: string;
    element: React.ReactElement;
}

export interface ToolbarElementProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const ToolbarElement = ({
    name,
    element,
    after = undefined,
    before = undefined,
    remove = false
}: ToolbarElementProps) => {
    const placeBefore = before !== undefined ? `element:${before}` : undefined;
    const placeAfter = after !== undefined ? `element:${after}` : undefined;

    return (
        <Property
            id={`element:${name}`}
            name={"toolbarElements"}
            array={true}
            before={placeBefore}
            after={placeAfter}
            remove={remove}
        >
            <Property id={`element:${name}:name`} name={"name"} value={name} />
            {element ? (
                <Property id={`element:${name}:element`} name={"element"} value={element} />
            ) : null}
        </Property>
    );
};
