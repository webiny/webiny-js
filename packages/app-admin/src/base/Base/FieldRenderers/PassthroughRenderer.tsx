import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { useFormViewRenderers } from "~/features/formModel/FormView.js";
import { Grid } from "@webiny/admin-ui";

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
        <Grid>
            {children
                .filter(childField => {
                    const Renderer = childField.renderer
                        ? fieldRenderers[childField.renderer]
                        : undefined;

                    return !!Renderer;
                })
                .map(childField => {
                    const Renderer = fieldRenderers[childField.renderer!];

                    return (
                        <Grid.Column key={childField.name} span={12}>
                            <Renderer field={childField} />
                        </Grid.Column>
                    );
                })}
        </Grid>
    );
});
