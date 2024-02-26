import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo, gridNoPaddingClass } from "@webiny/app-admin/components/Permissions";
import { Form } from "@webiny/form";
import { ApwSecurityPermission } from "~/types";

const t = i18n.ns("app-apw/plugins/permissionRenderer");

const APW_PERMISSION = "apw.";
const YES_STATEMENT = "yes";
const NO_STATEMENT = "no";

const apwKeys: string[] = ["publishingWorkflows"];

export interface ApwPermissionsProps {
    value: ApwSecurityPermission[];
    onChange: (value: ApwSecurityPermission[]) => void;
}
export const ApwPermissions = ({ value, onChange }: ApwPermissionsProps) => {
    const onFormChange = useCallback(
        (data: ApwSecurityPermission) => {
            const initialPermissions = value.filter(
                v => v.name.startsWith(APW_PERMISSION) === false
            );

            const values = Object.keys(data).reduce<ApwSecurityPermission[]>((permissions, key) => {
                if (data[key] !== YES_STATEMENT) {
                    return permissions;
                }
                permissions.push({
                    name: `${APW_PERMISSION}${key}`
                });

                return permissions;
            }, initialPermissions);
            onChange(values);
        },
        [value]
    );

    const formData = useMemo(() => {
        // This function only runs once on Form mount
        if (!Array.isArray(value)) {
            return {
                publishingWorkflows: NO_STATEMENT
            };
        }

        const permissions = value.filter(item => item.name.startsWith(APW_PERMISSION));

        if (!permissions.length) {
            return {
                publishingWorkflows: NO_STATEMENT
            };
        }

        return apwKeys.reduce<Omit<ApwSecurityPermission, "name">>((collection, key) => {
            const target = `${APW_PERMISSION}${key}`;
            const hasPermission = permissions.some(item => item.name === target);
            if (!hasPermission) {
                return collection;
            }
            collection[key] = hasPermission ? YES_STATEMENT : NO_STATEMENT;
            return collection;
        }, {});
    }, []);

    return (
        <Form
            data={formData}
            onChange={data => {
                /**
                 * We know that data is ApwSecurityPermission.
                 */
                return onFormChange(data as unknown as ApwSecurityPermission);
            }}
        >
            {({ Bind }) => {
                return (
                    <Fragment>
                        <Grid className={gridNoPaddingClass}>
                            <Cell span={6}>
                                <PermissionInfo title={t`Manage Workflows`} />
                            </Cell>
                            <Cell span={6}>
                                <Bind name={"publishingWorkflows"}>
                                    <Select label={t`Manage Workflows`}>
                                        <option value={NO_STATEMENT}>{t`No`}</option>
                                        <option value={YES_STATEMENT}>{t`Yes`}</option>
                                        {/*<option value={CUSTOM_ACCESS}>{t`Custom access`}</option>*/}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    </Fragment>
                );
            }}
        </Form>
    );
};
