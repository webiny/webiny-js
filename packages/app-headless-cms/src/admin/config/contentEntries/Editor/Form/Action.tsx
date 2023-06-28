import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useModel } from "~/admin/hooks";

type Position = "primary" | "secondary" | "tertiary";

export interface ActionConfig {
    name: string;
    position?: Position;
    element: React.ReactElement;
}

export interface ActionProps {
    name: string;
    position?: Position;
    element?: React.ReactElement<unknown>;
    modelIds?: string[];
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Action: React.FC<ActionProps> = ({
    name,
    position = "primary",
    element,
    modelIds = [],
    after = undefined,
    before = undefined,
    remove = false
}) => {
    const { model } = useModel();
    const getId = useIdGenerator("action");

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="form" name={"form"}>
            <Property
                id={getId(name)}
                name={"actions"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "position")} name={"position"} value={position} />
                {element ? (
                    <Property id={getId(name, "element")} name={"element"} value={element} />
                ) : null}
            </Property>
        </Property>
    );
};
