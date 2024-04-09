import React from "react";
import { OptionsMenuItem } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface ActionProps {
    name: string;
    element?: React.ReactElement;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const BaseAction = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
}: ActionProps) => {
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
                {element ? (
                    <Property id={getId(name, "element")} name={"element"} value={element} />
                ) : null}
            </Property>
        </Property>
    );
};

export const Action = Object.assign(BaseAction, {
    OptionsMenuItem
});
