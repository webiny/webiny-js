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
import { useAuthentication } from "@webiny/app-admin";
import { getFieldPermissions, type FieldPermissions } from "./getFieldPermissions.js";
import { FieldPermissionProvider, useFieldPermissions } from "./FieldPermissionProvider.js";

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
                    {(() => {
                        // Count visible string cells for column span calculation.
                        const visibleStringCells = row.filter(c => {
                            if (typeof c !== "string") {
                                return false;
                            }
                            const f = getFieldById(fields, c);
                            if (!f) {
                                return true;
                            }
                            return intersectPermissions(
                                parentPermissions,
                                getFieldPermissions(identity, f)
                            ).canView;
                        });
                        const span =
                            visibleStringCells.length > 0
                                ? (Math.floor(
                                      12 / visibleStringCells.length
                                  ) as ColumnProps["span"])
                                : (12 as ColumnProps["span"]);

                        return row.map(cell => {
                            if (isLayoutDescriptor(cell)) {
                                const permissions = intersectPermissions(
                                    parentPermissions,
                                    getFieldPermissions(identity, cell)
                                );
                                if (!permissions.canView) {
                                    return null;
                                }
                                return (
                                    <FieldPermissionProvider
                                        key={cell.id}
                                        permissions={permissions}
                                    >
                                        <LayoutDescriptorCell
                                            descriptor={cell}
                                            Bind={Bind}
                                            fields={fields}
                                            contentModel={contentModel}
                                            gridClassName={gridClassName}
                                        />
                                    </FieldPermissionProvider>
                                );
                            }

                            // String field ID
                            const id = cell;
                            const field = getFieldById(fields, id) as CmsModelField;
                            const permissions = intersectPermissions(
                                parentPermissions,
                                field
                                    ? getFieldPermissions(identity, field)
                                    : { canView: true, canEdit: true }
                            );

                            if (!permissions.canView) {
                                return null;
                            }

                            return (
                                <Grid.Column span={span} key={id}>
                                    {field ? (
                                        <FieldPermissionProvider permissions={permissions}>
                                            <FieldElement
                                                field={field}
                                                Bind={Bind}
                                                contentModel={contentModel}
                                            />
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
                        });
                    })()}
                </React.Fragment>
            ))}
        </Grid>
    );
};
