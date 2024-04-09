import React from "react";
import { Property } from "@webiny/react-properties";

export interface PluginConfig {
    name: string;
    element: React.ReactElement;
}

export interface PluginProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Plugin = ({
    name,
    element,
    after = undefined,
    before = undefined,
    remove = false
}: PluginProps) => {
    const placeBefore = before !== undefined ? `plugin:${before}` : undefined;
    const placeAfter = after !== undefined ? `plugin:${after}` : undefined;

    return (
        <Property
            id={`plugins:${name}`}
            name={"plugins"}
            array={true}
            before={placeBefore}
            after={placeAfter}
            remove={remove}
        >
            <Property id={`plugin:${name}:name`} name={"name"} value={name} />
            {element ? (
                <Property id={`plugin:${name}:element`} name={"element"} value={element} />
            ) : null}
        </Property>
    );
};
