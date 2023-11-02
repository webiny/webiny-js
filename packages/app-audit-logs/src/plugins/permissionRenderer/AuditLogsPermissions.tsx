import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import {
    CannotUseAaclAlert,
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-admin/components/Permissions";
import { Form } from "@webiny/form";
import { useSecurity } from "@webiny/app-security";
import { SecurityPermission } from "@webiny/app-security/types";
import { AaclPermission } from "@webiny/app-admin";

const t = i18n.ns("app-audit-logs/plugins/permissionRenderer");

const AUDIT_LOGS = "al";
const AUDIT_LOGS_FULL_ACCESS = "al.*";
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

interface PageBuilderPermissionsProps {
    value: SecurityPermission;
    onChange: (value: SecurityPermission[]) => void;
}
export const AuditLogsPermissions: React.FC<PageBuilderPermissionsProps> = ({
    value,
    onChange
}) => {
    const { getPermission } = useSecurity();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAAcl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const onFormChange = useCallback(
        formData => {
            let newValue: SecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `al*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(AUDIT_LOGS));
            }

            if (formData.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (formData.accessLevel === FULL_ACCESS) {
                newValue.push({ name: AUDIT_LOGS_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === AUDIT_LOGS_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(AUDIT_LOGS));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        const formData = {
            accessLevel: CUSTOM_ACCESS
        };

        return formData;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={12}>
                            {data.accessLevel === "custom" && cannotUseAAcl && (
                                <CannotUseAaclAlert />
                            )}
                        </Cell>
                    </Grid>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"accessLevel"}>
                                <Select label={t`Access Level`}>
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && <></>}
                </Fragment>
            )}
        </Form>
    );
};
