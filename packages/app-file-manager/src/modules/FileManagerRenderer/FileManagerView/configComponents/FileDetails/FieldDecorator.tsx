import React from "react";
import {
    Compose,
    createConditionalDecorator,
    CompositionScope,
    GenericComponent,
    Decorator
} from "@webiny/app-admin";
import { FieldElement } from "@webiny/app-headless-cms";

export type FieldProps = React.ComponentProps<typeof FieldElement>;

const shouldDecorate = (decoratorProps: FieldDecoratorProps, componentProps: FieldProps) => {
    const { id } = decoratorProps;

    if (id) {
        return id === "*" ? true : id === componentProps.field.id;
    }

    return true;
};

export type FieldDecoratorProps = {
    id?: string;
};

export const createScopedFieldDecorator =
    (scope = "*") =>
    (decorator: Decorator<GenericComponent<FieldProps>>) => {
        return function FieldDecorator(props: FieldDecoratorProps) {
            const conditionalDecorator = createConditionalDecorator(
                shouldDecorate,
                decorator,
                props
            );

            return (
                <CompositionScope name={scope}>
                    <Compose component={FieldElement} with={conditionalDecorator} />
                </CompositionScope>
            );
        };
    };
