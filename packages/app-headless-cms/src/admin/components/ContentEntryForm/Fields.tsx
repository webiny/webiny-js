import React from "react";
import { BindComponent } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import RenderFieldElement from "./RenderFieldElement";
import { CmsEditorContentModel, CmsEditorField, CmsEditorFieldsLayout } from "~/types";

interface Props {
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
    fields: CmsEditorField[];
    layout: CmsEditorFieldsLayout;
    gridClassName?: string;
}

const getFieldById = (fields, id): CmsEditorField => fields.find(field => field.id === id);

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: Props) => {
    return (
        <Grid className={gridClassName}>
            {layout.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                    {row.map(fieldId => (
                        <Cell span={Math.floor(12 / row.length)} key={fieldId}>
                            <RenderFieldElement
                                field={getFieldById(fields, fieldId)}
                                Bind={Bind}
                                contentModel={contentModel}
                            />
                        </Cell>
                    ))}
                </React.Fragment>
            ))}
        </Grid>
    );
};
