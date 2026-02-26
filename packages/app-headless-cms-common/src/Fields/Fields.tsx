import React from "react";
import { Alert, type ColumnProps, Grid, Separator, Text } from "@webiny/admin-ui";
import { FieldElement } from "./FieldElement.js";
import { FieldElementError } from "./FieldElementError.js";
import type {
    BindComponent,
    CmsEditorContentModel,
    CmsEditorFieldsLayout,
    CmsModelField
} from "~/types/index.js";
import type {
    CmsEditorLayoutCell,
    CmsAlertLayoutDescriptor,
    CmsSeparatorLayoutDescriptor,
    CmsTabLayoutDescriptor
} from "~/types/model.js";
import { isLayoutDescriptor } from "~/types/model.js";

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

/**
 * Render a layout descriptor cell in the content form.
 */
const LayoutDescriptorCell = ({
    cell,
    Bind,
    fields,
    contentModel,
    gridClassName
}: {
    cell: CmsEditorLayoutCell;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}) => {
    if (!isLayoutDescriptor(cell)) {
        return null;
    }

    switch (cell.type) {
        case "separator": {
            const separatorDescriptor = cell as CmsSeparatorLayoutDescriptor;
            return (
                <Grid.Column span={12}>
                    <Separator variant={"accent"}>{separatorDescriptor.label}</Separator>
                    {separatorDescriptor.description && (
                        <Text
                            as={"div"}
                            size={"sm"}
                            className={"text-neutral-strong text-center mt-sm"}
                        >
                            {separatorDescriptor.description}
                        </Text>
                    )}
                </Grid.Column>
            );
        }
        case "alert": {
            const alertDescriptor = cell as CmsAlertLayoutDescriptor;
            return (
                <Grid.Column span={12}>
                    <Alert type={alertDescriptor.alertType}>{alertDescriptor.label}</Alert>
                </Grid.Column>
            );
        }
        case "tabs": {
            const tabsDescriptor = cell as CmsTabLayoutDescriptor;
            return (
                <Grid.Column span={12}>
                    {/* Render tabs content inline for now — a proper Tabs UI can be added later */}
                    {tabsDescriptor.tabs.map(tab => (
                        <div key={tab.id}>
                            <Fields
                                Bind={Bind}
                                fields={fields}
                                layout={tab.layout}
                                contentModel={contentModel}
                                gridClassName={gridClassName}
                            />
                        </div>
                    ))}
                </Grid.Column>
            );
        }
        default:
            return null;
    }
};

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: FieldsProps) => {
    if (fields.length > 0 && layout.length === 0) {
        return <LayoutNotDefined />;
    }

    return (
        <Grid className={gridClassName}>
            {layout.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                    {row.map((cell, cellIndex) => {
                        // Handle layout descriptors (separator, alert, tabs)
                        if (isLayoutDescriptor(cell)) {
                            return (
                                <LayoutDescriptorCell
                                    key={`layout-${cell.type}-${rowIndex}-${cellIndex}`}
                                    cell={cell}
                                    Bind={Bind}
                                    fields={fields}
                                    contentModel={contentModel}
                                    gridClassName={gridClassName}
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
