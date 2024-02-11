import React from "react";
import {
    Compose,
    createConditionalDecorator,
    CompositionScope,
    GenericComponent,
    GenericDecorator
} from "@webiny/app-admin";
import { RenderFieldElement } from "@webiny/app-headless-cms";

export type FieldProps = React.ComponentProps<typeof RenderFieldElement>;

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
    (decorator: GenericDecorator<GenericComponent<FieldProps>>) => {
        return function FieldDecorator(props: FieldDecoratorProps) {
            const conditionalDecorator = createConditionalDecorator(
                shouldDecorate,
                decorator,
                props
            );

            return (
                <CompositionScope name={scope}>
                    <Compose component={RenderFieldElement} with={conditionalDecorator} />
                </CompositionScope>
            );
        };
    };
