import React from "react";
import { Property } from "@webiny/react-properties";

export interface FilterConfig {
    name: string;
    element: React.ReactElement;
}

export interface FilterProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Filter: React.FC<FilterProps> = ({
    name,
    element,
    after = undefined,
    before = undefined,
    remove = false
}) => {
    const placeBefore = before !== undefined ? `filter:${before}` : undefined;
    const placeAfter = after !== undefined ? `filter:${after}` : undefined;

    return (
        <Property id="browser" name={"browser"}>
            <Property
                id={`filter:${name}`}
                name={"filters"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={`filter:${name}:name`} name={"name"} value={name} />
                {element ? (
                    <Property id={`filter:${name}:element`} name={"element"} value={element} />
                ) : null}
            </Property>
        </Property>
    );
};
