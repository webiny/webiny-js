import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { createDecoratorFactory, makeDecoratable } from "@webiny/react-composition";
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

export interface CreateDecoratorParams {
    name: string;
    modelIds?: string[];
}

const BaseFilter = makeDecoratable(
    "Filter",
    ({
        name,
        element,
        modelIds = [],
        after = undefined,
        before = undefined,
        remove = false
    }: FilterProps) => {
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
    }
);

const createDecorator = createDecoratorFactory<CreateDecoratorParams>()(
    BaseFilter,
    (decoratorProps, componentProps) => {
        const { model } = useModel();

        if (decoratorProps?.modelIds?.length && !decoratorProps.modelIds.includes(model.modelId)) {
            return false;
        }

        if (decoratorProps.name === "*") {
            return true;
        }

        return decoratorProps.name === componentProps.name;
    }
);

export const Filter = Object.assign(BaseFilter, { createDecorator });
