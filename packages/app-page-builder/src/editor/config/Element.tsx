import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ElementConfig {
    name: string;
    group: string;
    scope: string;
    element: JSX.Element;
}

export interface ElementProps {
    name: string;
    element?: JSX.Element;
    group?: string;
    scope?: string;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Element = makeDecoratable(
    "EditorElement",
    ({ name, element, group, scope, remove, before, after }: ElementProps) => {
        const getId = useIdGenerator("element");

        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <Property
                id={getId(name)}
                name={"elements"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                {element ? (
                    <Property id={getId(name, "element")} name={"element"} value={element} />
                ) : null}
                {group ? <Property id={getId(name, "group")} name={"group"} value={group} /> : null}
                {scope ? <Property id={getId(name, "scope")} name={"scope"} value={scope} /> : null}
            </Property>
        );
    }
);
