import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Select } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { PermissionInfo, gridWithPaddingClass } from "@webiny/app-admin";
import { Form } from "@webiny/form";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const TENANT_MANAGER = "tm";
const TENANT_MANAGER_FULL_ACCESS = `${TENANT_MANAGER}.*`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";

const NO_ACCESS_DATA = { accessLevel: NO_ACCESS };

interface TenantManagerPermissionItem {
    accessLevel?: string;
    name?: string;
}
interface TenantManagerPermissionsProps {
    value: TenantManagerPermissionItem;
    onChange: (value: TenantManagerPermissionItem[]) => void;
}

export const TenantManagerPermissions = ({ value, onChange }: TenantManagerPermissionsProps) => {
    const onFormChange = useCallback(
        (data: TenantManagerPermissionItem) => {
            let newValue: TenantManagerPermissionItem[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `file-manager*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(TENANT_MANAGER));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: TENANT_MANAGER_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo((): TenantManagerPermissionItem => {
        if (!Array.isArray(value)) {
            return NO_ACCESS_DATA;
        }

        const hasFullAccess = value.find(
            item => item.name === TENANT_MANAGER_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        return NO_ACCESS_DATA;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ Bind }) => (
                <Fragment>
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
                </Fragment>
            )}
        </Form>
    );
};
