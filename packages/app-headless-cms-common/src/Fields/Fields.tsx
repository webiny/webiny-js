import React from "react";
import { type ColumnProps, Grid } from "@webiny/admin-ui";
import { FieldElement } from "./FieldElement.js";
import { FieldElementError } from "./FieldElementError.js";
import type {
    BindComponent,
    CmsEditorContentModel,
    CmsEditorFieldsLayout,
    CmsModelField
} from "~/types/index.js";

interface FieldsProps {
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
    fields: CmsModelField[];
    layout: CmsEditorFieldsLayout;
    gridClassName?: string;
}

const getFieldById = (fields: CmsModelField[], id: string): CmsModelField | null => {
    return fields.find(field => field.id === id) || null;
};

const FieldsNotDefined = () => (
    <div className={"p-4 bg-yellow-50 border border-yellow-200 rounded"}>
        <strong className={"block text-sm font-medium text-yellow-800"}>No fields defined!</strong>
        <span className={"block mt-1 text-sm text-yellow-700"}>
            Please define the layout for this content model.
        </span>
    </div>
);

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: FieldsProps) => {
    
    if (!layout?.length) {
        return <FieldsNotDefined />;
    }
    
    return (
        <Grid className={gridClassName}>
            {layout.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                    {row.map(id => {
                        const field = getFieldById(fields, id) as CmsModelField;

                        return (
                            <Grid.Column
                                span={Math.floor(12 / row.length) as ColumnProps["span"]}
                                key={id}
                            >
                                {field ? (
                                    <FieldElement
                                        field={field}
                                        Bind={Bind}
                                        contentModel={contentModel}
                                    />
                                ) : (
                                    <FieldElementError
                                        title={`Missing field with id "${id}"!`}
                                        description={
                                            "Make sure field layout contains the correct field ids (hint: check for typos)."
                                        }
                                    />
                                )}
                            </Grid.Column>
                        );
                    })}
                </React.Fragment>
            ))}
        </Grid>
    );
};
