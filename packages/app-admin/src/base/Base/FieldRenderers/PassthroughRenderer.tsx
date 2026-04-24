import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { useFormViewRenderers } from "~/features/formModel/FormView.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        passthrough: { fieldType: string; settings: undefined };
    }
}

const isObjectFieldVM = (field: IFieldVM): field is IObjectFieldVM => {
    return field.type === "object";
};

export const PassthroughRenderer = observer(({ field }: { field: IFieldVM }) => {
    const { fieldRenderers } = useFormViewRenderers();

    if (!isObjectFieldVM(field)) {
        return null;
    }

    const children = field.isList ? [] : field.fields;

    return (
        <>
            {children.map(childField => {
                const Renderer = childField.renderer
                    ? fieldRenderers[childField.renderer]
                    : undefined;

                if (!Renderer) {
                    return null;
                }

                return <Renderer key={childField.name} field={childField} />;
            })}
        </>
    );
});
