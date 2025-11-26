import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { gridWithPaddingClass, PermissionInfo } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import { Grid, Select } from "@webiny/admin-ui";

const t = i18n.ns("app-workflows/Components/WorkflowsPermissionsForm");

const WORKFLOWS_PERMISSION = "workflows";
const WORKFLOWS_PERMISSION_FULL_ACCESS = "workflows.*";
const FULL_ACCESS = "full";
const NO_ACCESS = "no";

interface IWorkflowsPermissionsFormProps {
    value: IWorkflowsSecurityPermission[];
    onChange: (value: IWorkflowsSecurityPermission[]) => void;
}

export const WorkflowsPermissionsForm = ({ value, onChange }: IWorkflowsPermissionsFormProps) => {
    const onFormChange = useCallback(
        (data: IWorkflowsSecurityPermission) => {
            let newValue: IWorkflowsSecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `cms*` permission objects.
                // Based on the `data` we rebuild new permission object from scratch.
                newValue = value.filter(item => !item.name.startsWith(WORKFLOWS_PERMISSION));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({
                    name: WORKFLOWS_PERMISSION_FULL_ACCESS
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
                name: WORKFLOWS_PERMISSION,
                accessLevel: NO_ACCESS
            };
        }

        const hasFullAccess = value.some(
            item => item.name === WORKFLOWS_PERMISSION_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return {
                name: WORKFLOWS_PERMISSION,
                accessLevel: FULL_ACCESS
            };
        }

        return {
            name: WORKFLOWS_PERMISSION,
            accessLevel: NO_ACCESS
        };
    }, []);

    return (
        <Form<IWorkflowsSecurityPermission> data={initialFormData} onChange={onFormChange}>
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
                                            value: NO_ACCESS,
                                            label: t`No access`
                                        },
                                        {
                                            value: FULL_ACCESS,
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
