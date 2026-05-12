import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { makeDecoratable, createDecoratorFactory } from "@webiny/app-admin";

export interface FieldConfig {
    name: string;
    element: React.ReactElement;
}

export interface FieldProps {
    name: string;
    element?: React.ReactElement<unknown>;
    remove?: boolean;
    before?: string;
    after?: string;
}

const BaseField = makeDecoratable(
    "Field",
    ({ name, element, after = undefined, before = undefined, remove = false }: FieldProps) => {
        const getId = useIdGenerator("field");
        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <Property id="fileDetails" name={"fileDetails"}>
                <Property
                    id={getId(name)}
                    name={"fields"}
                    array={true}
                    before={placeBefore}
                    after={placeAfter}
                    remove={remove}
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
    BaseField,
    (decoratorProps, componentProps) => {
        if (decoratorProps.name === "*") {
            return true;
        }

        return decoratorProps.name === componentProps.name;
    }
);

export const Field = Object.assign(BaseField, { createDecorator });
