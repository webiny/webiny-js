import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM, IObjectFieldVM, FieldRendererSettings } from "./abstractions.js";

type RendererField<TName extends string> = IFieldVM & {
    rendererSettings: FieldRendererSettings<TName>;
};

type ObjectRendererField<TName extends string> = IObjectFieldVM & {
    rendererSettings: FieldRendererSettings<TName>;
};

type FieldRendererFn<TName extends string> = (props: {
    field: RendererField<TName>;
}) => React.ReactNode;

export function createFieldRenderer<TName extends string = string>(
    render: FieldRendererFn<TName>
): React.ComponentType<{ field: IFieldVM }> {
    return observer(render as FieldRendererFn<string>) as unknown as React.ComponentType<{
        field: IFieldVM;
    }>;
}

export function createObjectFieldRenderer<TName extends string = string>(
    render: (props: { field: ObjectRendererField<TName> }) => React.ReactNode
): React.ComponentType<{ field: IFieldVM }> {
    const Wrapped = (props: { field: IFieldVM }) => {
        if (props.field.type !== "object") {
            return null;
        }
        return (render as (p: { field: IFieldVM }) => React.ReactNode)(props);
    };
    return observer(Wrapped) as unknown as React.ComponentType<{ field: IFieldVM }>;
}
