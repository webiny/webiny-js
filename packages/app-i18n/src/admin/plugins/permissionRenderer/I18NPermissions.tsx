import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo, gridNoPaddingClass } from "@webiny/app-admin/components/Permissions";
import { Form } from "@webiny/form";
import { SecurityPermission } from "@webiny/app-security/types";
import { I18NSecurityPermission } from "~/types";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

const I18N = "i18n";
const I18N_FULL_ACCESS = `${I18N}.*`;
const I18N_LOCALES = `${I18N}.locales`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";

interface I18NPermissionsProps {
    value: SecurityPermission[];
    onChange: (value: SecurityPermission[]) => void;
}
export const I18NPermissions = ({ value, onChange }: I18NPermissionsProps) => {
    const onFormChange = useCallback(
        (data: I18NSecurityPermission): void => {
            let newValue: SecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `i18n*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(I18N));
            }

            let permission;
            if (data.level === FULL_ACCESS) {
                permission = {
                    name: I18N_FULL_ACCESS
                };
            } else if (data.locales) {
                permission = {
                    name: I18N_LOCALES
                };
            }

            if (permission) {
                newValue.push(permission);
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { level: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === I18N_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { level: FULL_ACCESS };
        }

        const permission = value.find(item => item.name.startsWith(I18N));
        if (!permission) {
            return { level: NO_ACCESS };
        }
        return {};
    }, []);

    return (
        <Form
            data={formData}
            onChange={data => {
                /**
                 * We are positive that data is I18NSecurityPermission.
                 */
                return onFormChange(data as I18NSecurityPermission);
            }}
        >
            {({ Bind }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"level"}>
                                <Select label={t`Access Level`}>
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                </Fragment>
            )}
        </Form>
    );
};
