import React from "react";
// @ts-expect-error Remove this one moduleResolution is set to `bundler`
import { compiler } from "markdown-to-jsx/react";
import { Grid, type ColumnProps } from "@webiny/admin-ui";
import { FieldElement } from "./FieldElement.js";
import { FieldElementError } from "./FieldElementError.js";
import type {
    CmsEditorContentModel,
    CmsModelField,
    CmsEditorFieldsLayout,
    BindComponent
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

const withMarkdown = (field: CmsModelField) => {
    if (typeof field.helpText !== "string") {
        return field;
    }

    return { ...field, helpText: compiler(field.helpText) };
};

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: FieldsProps) => {
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
                                        field={withMarkdown(field)}
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
