import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid/index.js";
import { Select } from "@webiny/ui/Select/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    CannotUseAaclAlert,
    PermissionInfo,
    gridWithPaddingClass,
    PermissionsGroup,
    type AaclPermission
} from "@webiny/app-admin";
import { Form } from "@webiny/form";
import type { SecurityPermission } from "@webiny/app-security/types.js";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-security-admin-users/plugins/permissionRenderer");

const ADMIN_USERS = "adminUsers";
const ADMIN_USERS_FULL_ACCESS = `${ADMIN_USERS}.*`;
const ADMIN_USERS_USER_ACCESS = `${ADMIN_USERS}.user`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export interface AdminUsersPermissionsProps {
    value: SecurityPermission[];
    onChange: (value: SecurityPermission[]) => void;
}

interface OnFormChangeCallable {
    (data: SecurityPermission): void;
}

export const AdminUsersPermissions = ({ value, onChange }: AdminUsersPermissionsProps) => {
    const { getPermission } = useSecurity();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAAcl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const onFormChange = useCallback<OnFormChangeCallable>(
        data => {
            let newValue: SecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `security*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(ADMIN_USERS));
            }

            const permissions = [];
            if (data.accessLevel === FULL_ACCESS) {
                permissions.push({ name: ADMIN_USERS_FULL_ACCESS });
            } else if (data.accessLevel === CUSTOM_ACCESS) {
                if (data.userAccessScope === FULL_ACCESS) {
                    permissions.push({ name: ADMIN_USERS_USER_ACCESS });
                }
            }

            if (permissions && permissions.length) {
                newValue.push(...permissions);
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === ADMIN_USERS_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(ADMIN_USERS));
        if (permissions.length === 0) {
            return { accessLevel: NO_ACCESS };
        }

        const data = {
            accessLevel: CUSTOM_ACCESS,
            userAccessScope: NO_ACCESS
        };

        const hasUserAccess = permissions.find(item => item.name === ADMIN_USERS_USER_ACCESS);
        if (hasUserAccess) {
            data.userAccessScope = FULL_ACCESS;
        }

        return data;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => {
                const disableUserAccessScope = data.groupAccessScope === NO_ACCESS;
                return (
                    <Fragment>
                        <Grid className={gridWithPaddingClass}>
                            <Cell span={12}>
                                {data.accessLevel === "custom" && cannotUseAAcl && (
                                    <CannotUseAaclAlert />
                                )}
                            </Cell>
                        </Grid>
                        <Grid className={gridWithPaddingClass}>
                            <Cell span={6}>
                                <PermissionInfo title={t`Access Level`} />
                            </Cell>
                            <Cell span={6}>
                                <Bind name={"accessLevel"}>
                                    <Select>
                                        <option value={NO_ACCESS}>{t`No access`}</option>
                                        <option value={FULL_ACCESS}>{t`Full access`}</option>
                                        <option value={CUSTOM_ACCESS}>{t`Custom access`}</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        {data.accessLevel === CUSTOM_ACCESS && (
                            <div className={"mt-lg"}>
                                <PermissionsGroup title={t`Users`}>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"userAccessScope"}>
                                                {({ value, ...props }) => (
                                                    <Select
                                                        {...props}
                                                        label={t`Access Scope`}
                                                        disabled={
                                                            cannotUseAAcl || disableUserAccessScope
                                                        }
                                                        value={
                                                            disableUserAccessScope
                                                                ? NO_ACCESS
                                                                : value
                                                        }
                                                    >
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`Full access`}</option>
                                                    </Select>
                                                )}
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </PermissionsGroup>
                            </div>
                        )}
                    </Fragment>
                );
            }}
        </Form>
    );
};
