import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { makeDecoratable } from "@webiny/app-admin";

export interface ActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface ActionProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Action = makeDecoratable(
    "Action",
    ({ name, element, after = undefined, before = undefined, remove = false }: ActionProps) => {
        const getId = useIdGenerator("browser:grid:action");
        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <Property id="browser" name={"browser"}>
                <Property id="grid" name={"grid"}>
                    <Property
                        id={getId(name)}
                        name={"itemActions"}
                        array={true}
                        before={placeBefore}
                        after={placeAfter}
                        remove={remove}
                    >
                        <Property id={getId(name, "name")} name={"name"} value={name} />
                        {element ? (
                            <Property
                                id={getId(name, "element")}
                                name={"element"}
                                value={element}
                            />
                        ) : null}
                    </Property>
                </Property>
            </Property>
        );
    }
);
