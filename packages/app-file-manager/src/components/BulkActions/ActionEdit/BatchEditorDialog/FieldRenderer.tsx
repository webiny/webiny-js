import React from "react";

import { RenderFieldElement, ModelProvider } from "@webiny/app-headless-cms";
import { Bind, Form, useBind } from "@webiny/form";

import { FieldDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";

import { useFileModel } from "~/hooks/useFileModel";

export interface FieldRendererProps {
    name: string;
    operator: string;
    field?: FieldDTO;
}

export const FieldRenderer = (props: FieldRendererProps) => {
    const fileModel = useFileModel();

    const { onChange } = useBind({
        name: props.name
    });

    if (!props.field) {
        return null;
    }

    if (!props.operator || props.operator === OperatorType.REMOVE) {
        return null;
    }

    return (
        <ModelProvider model={fileModel}>
            <Form onChange={onChange}>
                {() => {
                    return (
                        <RenderFieldElement
                            field={props.field!.raw}
                            Bind={Bind as any}
                            contentModel={fileModel}
                        />
                    );
                }}
            </Form>
        </ModelProvider>
    );
};
