import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { makeComposable, createDecoratorFactory } from "@webiny/app-admin";

export interface FilterConfig {
    name: string;
    element: React.ReactElement;
}

export interface FilterProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

const BaseFilter = makeComposable<FilterProps>(
    "Filter",
    ({ name, element, after = undefined, before = undefined, remove = false }) => {
        const getId = useIdGenerator("filter");

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

const createDecorator = createDecoratorFactory<{ name: string }>()(
    BaseFilter,
    (decoratorProps, componentProps) => {
        if (decoratorProps.name === "*") {
            return true;
        }

        return decoratorProps.name === componentProps.name;
    }
);

export const Filter = Object.assign(BaseFilter, { createDecorator });
