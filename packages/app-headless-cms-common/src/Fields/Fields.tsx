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
import { getFieldPermissions, type FieldPermissions } from "./getFieldPermissions.js";
import { FieldPermissionProvider, useFieldPermissions } from "./FieldPermissionProvider.js";
import { useFieldRules } from "./useFieldRules.js";

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

/**
 * A child can never have more access than its parent.
 */
const intersectPermissions = (
    parent: FieldPermissions,
    child: FieldPermissions
): FieldPermissions => {
    return {
        canView: parent.canView && child.canView,
        canEdit: parent.canEdit && child.canEdit
    };
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
    parentPermissions: FieldPermissions;
    identity: { id: string; teams: { id: string }[] };
}

const LayoutCell = ({
    cell,
    Bind,
    fields,
    contentModel,
    gridClassName,
    parentPermissions,
    identity
}: LayoutCellProps) => {
    if (!isLayoutDescriptor(cell)) {
        return null;
    }

    const rulePermissions = useFieldRules(cell);
    const identityPermissions = getFieldPermissions(identity, cell);
    const permissions = intersectPermissions(
        parentPermissions,
        intersectPermissions(identityPermissions, rulePermissions)
    );

    if (!permissions.canView) {
        return null;
    }

    return (
        <FieldPermissionProvider permissions={permissions}>
            <LayoutDescriptorCell
                descriptor={cell}
                Bind={Bind}
                fields={fields}
                contentModel={contentModel}
                gridClassName={gridClassName}
            />
        </FieldPermissionProvider>
    );
};

/**
 * Renders a single data field cell with rules + permissions.
 */
interface FieldCellProps {
    id: string;
    field: CmsModelField | null;
    span: ColumnProps["span"];
    parentPermissions: FieldPermissions;
    identity: { id: string; teams: { id: string }[] };
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
}

const FieldCell = ({
    id,
    field,
    span,
    parentPermissions,
    identity,
    Bind,
    contentModel
}: FieldCellProps) => {
    const rulePermissions = useFieldRules(field ?? {});
    const identityPermissions = field
        ? getFieldPermissions(identity, field)
        : { canView: true, canEdit: true };
    const permissions = intersectPermissions(
        parentPermissions,
        intersectPermissions(identityPermissions, rulePermissions)
    );

    if (!permissions.canView) {
        return null;
    }

    return (
        <Grid.Column span={span}>
            {field ? (
                <FieldPermissionProvider permissions={permissions}>
                    <FieldElement field={field} Bind={Bind} contentModel={contentModel} />
                </FieldPermissionProvider>
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
    parentPermissions: FieldPermissions;
    identity: { id: string; teams: { id: string }[] };
}

const RowRenderer = ({
    row,
    fields,
    Bind,
    contentModel,
    gridClassName,
    parentPermissions,
    identity
}: RowRendererProps) => {
    // Count visible string cells for column span calculation.
    // This count is approximate based on identity permissions only (not rules),
    // because rules require per-field hooks and we can't call them in a filter.
    // The actual visibility is enforced in FieldCell.
    const visibleStringCells = row.filter(c => {
        if (typeof c !== "string") {
            return false;
        }
        const f = getFieldById(fields, c);
        if (!f) {
            return true;
        }
        return intersectPermissions(parentPermissions, getFieldPermissions(identity, f)).canView;
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
                            parentPermissions={parentPermissions}
                            identity={identity}
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
                        parentPermissions={parentPermissions}
                        identity={identity}
                        Bind={Bind}
                        contentModel={contentModel}
                    />
                );
            })}
        </>
    );
};

export const Fields = ({ Bind, fields, layout, contentModel, gridClassName }: FieldsProps) => {
    const { identity } = useAuthentication();
    const parentPermissions = useFieldPermissions();

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
                        parentPermissions={parentPermissions}
                        identity={identity}
                    />
                </React.Fragment>
            ))}
        </Grid>
    );
};
