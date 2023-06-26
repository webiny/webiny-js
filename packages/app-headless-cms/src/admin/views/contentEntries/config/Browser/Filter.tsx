import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useModel } from "~/admin/hooks";

export interface FilterConfig {
    name: string;
    element: React.ReactElement;
}

export interface FilterProps {
    name: string;
    element?: React.ReactElement<unknown>;
    modelIds?: string[];
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Filter: React.FC<FilterProps> = ({
    name,
    element,
    modelIds = [],
    after = undefined,
    before = undefined,
    remove = false
}) => {
    const { model } = useModel();
    const getId = useIdGenerator("filter");

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="browser" name={"browser"}>
            <Property
                id={getId(name)}
                name={"filters"}
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
