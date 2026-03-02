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
import type { CmsEditorLayoutCell } from "~/types/model.js";
import { isLayoutDescriptor } from "~/types/model.js";
import { LayoutDescriptorCell } from "./LayoutDescriptorCell.js";
import { useAuthentication } from "@webiny/app-admin";
import { FieldRulesProvider, useParentRules } from "./FieldRulesProvider.js";
import { evaluateAccessControlRules, useEffectiveRules } from "./useFieldRules.js";

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
 * Renders a single layout descriptor cell with rules + permissions.
 */
interface LayoutCellProps {
    cell: CmsEditorLayoutCell;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

const LayoutCell = ({ cell, Bind, fields, contentModel, gridClassName }: LayoutCellProps) => {
    const isLayout = isLayoutDescriptor(cell);
    const rules = useEffectiveRules(isLayout ? cell : {}, Bind.parentName);

    if (!isLayout) {
        return null;
    }

    if (!rules.canView || rules.hidden) {
        return null;
    }

    return (
        <FieldRulesProvider rules={rules}>
            <LayoutDescriptorCell
                descriptor={cell}
                Bind={Bind}
                fields={fields}
                contentModel={contentModel}
                gridClassName={gridClassName}
            />
        </FieldRulesProvider>
    );
};

/**
 * Renders a single data field cell with rules + permissions.
 */
interface FieldCellProps {
    id: string;
    field: CmsModelField | null;
    span: ColumnProps["span"];
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
}

const FieldCell = ({ id, field, span, Bind, contentModel }: FieldCellProps) => {
    const rules = useEffectiveRules(field ?? {}, Bind.parentName);

    if (!rules.canView || rules.hidden) {
        return null;
    }

    return (
        <Grid.Column span={span}>
            {field ? (
                <FieldRulesProvider rules={rules}>
                    <FieldElement field={field} Bind={Bind} contentModel={contentModel} />
                </FieldRulesProvider>
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
};

/**
 * Renders a single row, delegating each cell to FieldCell or LayoutCell.
 */
interface RowRendererProps {
    row: CmsEditorLayoutCell[];
    fields: CmsModelField[];
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

const RowRenderer = ({ row, fields, Bind, contentModel, gridClassName }: RowRendererProps) => {
    const { identity } = useAuthentication();
    const parentRules = useParentRules();

    // Count visible string cells for column span calculation.
    // This count is approximate based on access control rules only (not entry value rules),
    // because entry value rules require per-field hooks and we can't call them in a filter.
    // The actual visibility is enforced in FieldCell.
    const visibleStringCells = row.filter(c => {
        if (typeof c !== "string") {
            return false;
        }
        const f = getFieldById(fields, c);
        if (!f) {
            return true;
        }
        const acPerms = evaluateAccessControlRules(f, identity);
        return parentRules.canView && acPerms.canView;
    });

    const span =
        visibleStringCells.length > 0
            ? (Math.floor(12 / visibleStringCells.length) as ColumnProps["span"])
            : (12 as ColumnProps["span"]);

    return (
        <>
            {row.map(cell => {
                if (isLayoutDescriptor(cell)) {
                    return (
                        <LayoutCell
                            key={cell.id}
                            cell={cell}
                            Bind={Bind}
                            fields={fields}
                            contentModel={contentModel}
                            gridClassName={gridClassName}
                        />
                    );
                }

                const id = cell as string;
                const field = getFieldById(fields, id);

                return (
                    <FieldCell
                        key={id}
                        id={id}
                        field={field}
                        span={span}
                        Bind={Bind}
                        contentModel={contentModel}
                    />
                );
            })}
        </>
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
                    <RowRenderer
                        row={row}
                        fields={fields}
                        Bind={Bind}
                        contentModel={contentModel}
                        gridClassName={gridClassName}
                    />
                </React.Fragment>
            ))}
        </Grid>
    );
};
