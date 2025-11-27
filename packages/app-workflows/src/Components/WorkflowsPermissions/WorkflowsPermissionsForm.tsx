import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { gridWithPaddingClass, PermissionInfo } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import {
    type IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";
import { Grid, Select } from "@webiny/admin-ui";
import { WORKFLOWS_PERMISSION } from "./constants.js";

const t = i18n.ns("app-workflows/Components/WorkflowsPermissionsForm");

interface IWorkflowsPermissionsFormProps {
    value: IWorkflowsSecurityPermission[];
    onChange: (value: IWorkflowsSecurityPermission[]) => void;
}

export const WorkflowsPermissionsForm = ({
    value: inputValue,
    onChange
}: IWorkflowsPermissionsFormProps) => {
    const onFormChange = useCallback(
        (data: IWorkflowsSecurityPermission) => {
            const newValue: IWorkflowsSecurityPermission[] = (
                Array.isArray(inputValue) ? inputValue : []
            ).filter(item => !item.name.startsWith(WORKFLOWS_PERMISSION));

            newValue.push({
                name: WORKFLOWS_PERMISSION,
                editor: data.editor || WorkflowsSecurityPermissionAccessLevel.NO
            });

            onChange(newValue);
        },
        [inputValue]
    );

    const initialFormData = useMemo<IWorkflowsSecurityPermission>(() => {
        const target = Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];

        const hasFullAccess = target.some(
            item => item.name === WORKFLOWS_PERMISSION || item.name === "*"
        );

        if (hasFullAccess) {
            return {
                name: WORKFLOWS_PERMISSION,
                editor: WorkflowsSecurityPermissionAccessLevel.YES
            };
        }

        return {
            name: WORKFLOWS_PERMISSION,
            editor: WorkflowsSecurityPermissionAccessLevel.NO
        };
    }, [inputValue]);

    return (
        <Form<IWorkflowsSecurityPermission> data={initialFormData} onChange={onFormChange}>
            {({ Bind }) => (
                <>
                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={6}>
                            <PermissionInfo title={t`Workflows Editor`} />
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Bind name={"editor"}>
                                <Select
                                    options={[
                                        {
                                            value: WorkflowsSecurityPermissionAccessLevel.NO,
                                            label: t`No access`
                                        },
                                        {
                                            value: WorkflowsSecurityPermissionAccessLevel.YES,
                                            label: t`Has access`
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
