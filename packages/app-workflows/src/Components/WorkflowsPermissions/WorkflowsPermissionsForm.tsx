import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { gridWithPaddingClass, PermissionInfo } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import {
    type IWorkflowsEditorSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";
import { Grid, Select } from "@webiny/admin-ui";
import { WORKFLOWS_EDITOR_PERMISSION } from "./constants.js";

const t = i18n.ns("app-workflows/Components/WorkflowsPermissionsForm");


interface IWorkflowsPermissionsFormProps {
    value: IWorkflowsEditorSecurityPermission[];
    onChange: (value: IWorkflowsEditorSecurityPermission[]) => void;
}

export const WorkflowsPermissionsForm = ({ value, onChange }: IWorkflowsPermissionsFormProps) => {
    const onFormChange = useCallback(
        (data: IWorkflowsEditorSecurityPermission) => {
            let newValue: IWorkflowsEditorSecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `cms*` permission objects.
                // Based on the `data` we rebuild new permission object from scratch.
                newValue = value.filter(item => !item.name.startsWith(WORKFLOWS_EDITOR_PERMISSION));
            }

            if (data.accessLevel === WorkflowsSecurityPermissionAccessLevel.NONE) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === WorkflowsSecurityPermissionAccessLevel.FULL) {
                newValue.push({
                    name: WORKFLOWS_EDITOR_PERMISSION,
                    accessLevel: WorkflowsSecurityPermissionAccessLevel.FULL
                });
                onChange(newValue);
                return;
            }

            onChange(newValue);
        },
        [value]
    );

    const initialFormData = useMemo(() => {
        if (!Array.isArray(value) || !value.length) {
            return {
                name: WORKFLOWS_EDITOR_PERMISSION,
                accessLevel: WorkflowsSecurityPermissionAccessLevel.NONE
            };
        }

        const hasFullAccess = value.some(
            item => item.name === WORKFLOWS_EDITOR_PERMISSION || item.name === "*"
        );

        if (hasFullAccess) {
            return {
                name: WORKFLOWS_EDITOR_PERMISSION,
                accessLevel: WorkflowsSecurityPermissionAccessLevel.FULL
            };
        }

        return {
            name: WORKFLOWS_EDITOR_PERMISSION,
            accessLevel: WorkflowsSecurityPermissionAccessLevel.NONE
        };
    }, []);

    return (
        <Form<IWorkflowsEditorSecurityPermission> data={initialFormData} onChange={onFormChange}>
            {({ Bind }) => (
                <>
                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Bind name={"accessLevel"}>
                                <Select
                                    options={[
                                        {
                                            value: WorkflowsSecurityPermissionAccessLevel.NONE,
                                            label: t`No access`
                                        },
                                        {
                                            value: WorkflowsSecurityPermissionAccessLevel.FULL,
                                            label: t`Full access`
                                        }
                                    ]}
                                />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                </>
            )}
        </Form>
    );
};
