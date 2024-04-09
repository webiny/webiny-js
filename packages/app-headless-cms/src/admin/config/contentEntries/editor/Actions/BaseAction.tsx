import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useModel } from "~/admin/hooks";

export interface BaseActionConfig<T extends string> {
    name: string;
    element: React.ReactElement;
    $type: T;
}

export interface BaseActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    modelIds?: string[];
    element: React.ReactElement;
    $type: string;
}

export const BaseAction = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    modelIds = [],
    element,
    $type
}: BaseActionProps) => {
    const { model } = useModel();
    const getId = useIdGenerator("action");

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
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
            <Property id={getId(name, "$type")} name={"$type"} value={$type} />
        </Property>
    );
};
