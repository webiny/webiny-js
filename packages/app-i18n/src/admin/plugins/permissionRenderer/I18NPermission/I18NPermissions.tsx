import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import {
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-security-user-management/components/permission";
import { Form } from "@webiny/form";
import { Switch } from "@webiny/ui/Switch";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-i18n/admin/plugins/permissionRenderer");

const I18N = "i18n";
const I18N_FULL_ACCESS = `${I18N}.*`;
const I18N_LOCALES = `${I18N}.locales`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export const I18NPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `i18n*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(I18N));
            }

            let permission;
            if (data.level === FULL_ACCESS) {
                permission = { name: I18N_FULL_ACCESS };
            } else if (data.locales) {
                permission = { name: I18N_LOCALES };
            }

            if (permission) {
                newValue.push(permission);
            }

            onChange(newValue);
        },
        [securityGroup.id, value]
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

        // It's either "i18n.*" or "i18n.locales", that's why `locales: true`.
        return { level: CUSTOM_ACCESS, locales: true };
    }, [securityGroup.id]);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"level"}>
                                <Select label={t`Access Level`}>
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full Access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.level === CUSTOM_ACCESS && (
                        <Elevation z={1} style={{ marginTop: 10 }}>
                            <Grid>
                                <Cell span={12}>
                                    <Typography use={"overline"}>{t`Locales`}</Typography>
                                </Cell>
                                <Cell span={12}>
                                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                        <Cell span={6}>
                                            <PermissionInfo title={t`Manage locales`} />
                                        </Cell>
                                        <Cell span={6} align={"middle"}>
                                            <Bind name={"locales"}>
                                                <Switch />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </Cell>
                            </Grid>
                        </Elevation>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
