import React from "react";
import { Alert, type ColumnProps, Grid } from "@webiny/admin-ui";
import { FieldElement } from "./FieldElement.js";
import { FieldElementError } from "./FieldElementError.js";
import type {
    BindComponent,
    CmsEditorContentModel,
    CmsEditorFieldsLayout,
    CmsModelField
} from "~/types/index.js";
import { isLayoutDescriptor } from "~/types/model.js";
import { LayoutDescriptorCell } from "./LayoutDescriptorCell.js";

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

const LayoutNotDefined = () => {
    return (
        <Alert type={"warning"}>
            You are missing the layout definition in your code content model. Please ensure you have
            the layout property correctly defined.
        </Alert>
    );
};

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: FieldsProps) => {
    if (contentModel.plugin && fields.length > 0 && layout.length === 0) {
        return <LayoutNotDefined />;
    }

    return (
        <Grid className={gridClassName}>
            {layout.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                    {row.map(cell => {
                        if (isLayoutDescriptor(cell)) {
                            return (
                                <LayoutDescriptorCell
                                    key={cell.id}
                                    descriptor={cell}
                                    Bind={Bind}
                                    fields={fields}
                                    contentModel={contentModel}
                                    gridClassName={gridClassName}
                                    FieldsComponent={Fields}
                                />
                            );
                        }

                        // String field ID
                        const id = cell;
                        const field = getFieldById(fields, id) as CmsModelField;

                        // Count only string cells for column span calculation
                        const stringCellCount = row.filter(c => typeof c === "string").length;

                        return (
                            <Grid.Column
                                span={Math.floor(12 / stringCellCount) as ColumnProps["span"]}
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
