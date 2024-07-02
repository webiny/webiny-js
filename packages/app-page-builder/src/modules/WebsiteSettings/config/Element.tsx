import React from "react";
import { DocumentNode } from "graphql";
import { makeDecoratable } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ElementConfig {
    name: string;
    element: JSX.Element;
}

export interface ElementProps {
    name: string;
    element?: JSX.Element;
    children?: React.ReactNode;
    querySelection?: DocumentNode;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Element = makeDecoratable(
    "WebsiteSettingsElement",
    ({ name, remove, before, after, ...props }: ElementProps) => {
        const getId = useIdGenerator("element");
        const element = props.element ?? props.children;

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
            </Property>
        );
    }
);
