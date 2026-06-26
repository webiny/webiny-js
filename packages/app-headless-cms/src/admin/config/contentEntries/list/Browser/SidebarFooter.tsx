import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface SidebarFooterConfig {
    name: string;
    element: React.ReactElement;
}

export interface SidebarFooterProps {
    name: string;
    element?: React.ReactElement;
    after?: string;
    before?: string;
    remove?: boolean;
}

export const SidebarFooter = ({
    name,
    element,
    after = undefined,
    before = undefined,
    remove = false
}: SidebarFooterProps) => {
    const getId = useIdGenerator("sidebarFooter");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="browser" name={"browser"}>
            <Property
                id={getId(name)}
                name={"sidebarFooter"}
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
