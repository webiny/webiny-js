import React from "react";
import { RenderFieldElement, ModelProvider } from "@webiny/app-headless-cms";
import { Bind, BindPrefix } from "@webiny/form";
import { Cell } from "@webiny/ui/Grid";
import { FieldDTO, OperatorType } from "~/components/BulkActions/ActionEdit/domain";
import { useFileModel } from "~/hooks/useFileModel";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export interface FieldRendererProps {
    name: string;
    operator: string;
    field: FieldDTO;
}

export const FieldRenderer = (props: FieldRendererProps) => {
    const fileModel = useFileModel();
    const { browser } = useFileManagerViewConfig();

    if (!props.operator || props.operator === OperatorType.REMOVE) {
        return null;
    }

    const customFieldRenderer = browser.bulkEditFields.find(
        field => field.name === props.field.value
    );

    const renderer = customFieldRenderer ? (
        <BindPrefix name={props.name}>{customFieldRenderer.element}</BindPrefix>
    ) : (
        <BindPrefix name={props.name + ".extensions"}>
            <RenderFieldElement
                field={props.field.raw}
                Bind={Bind as any}
                contentModel={fileModel}
            />
        </BindPrefix>
    );

    return (
        <ModelProvider model={fileModel}>
            <Cell span={12}>{renderer}</Cell>
        </ModelProvider>
    );
};
