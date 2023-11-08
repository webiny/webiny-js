import React from "react";
import { useOptionsMenuItem } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface ActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    element: React.ReactElement;
}

export const BaseAction: React.FC<ActionProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
}) => {
    const getId = useIdGenerator("folderAction");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="folder" name={"folder"}>
            <Property
                id={getId(name)}
                name={"actions"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </Property>
    );
};

export const Action = Object.assign(BaseAction, {
    useOptionsMenuItem
});
