import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";

import {
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-security-tenancy/components/permission";
import { Form } from "@webiny/form";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-form-builder/admin/plugins/permissionRenderer");

const FB = "fb";
const FB_FULL_ACCESS = `${FB}.*`;
const FB_ACCESS_FORM = `${FB}.form`;
const FB_SETTINGS = `${FB}.settings`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export const FormBuilderPermissions = ({ value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `fb` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(FB));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: FB_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Form permission
            if (data.formAccessLevel && data.formAccessLevel !== NO_ACCESS) {
                const permission = {
                    name: FB_ACCESS_FORM,
                    own: false,
                    rwd: undefined,
                    submissions: false
                };

                if (data.formAccessLevel === "own") {
                    permission.own = true;
                } else {
                    permission.rwd = data.formPermissions || "r";
                }

                if (data.submissionPermissions && data.submissionPermissions !== NO_ACCESS) {
                    permission.submissions = true;
                }

                newValue.push(permission);
            }

            // Settings permission
            if (data.settingsAccessLevel === FULL_ACCESS) {
                newValue.push({ name: FB_SETTINGS });
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(item => item.name === FB_FULL_ACCESS || item.name === "*");

        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(FB));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        // We're dealing with custom permissions. Let's first prepare data for "forms" and "submissions".
        const data = {
            accessLevel: CUSTOM_ACCESS,
            formAccessLevel: NO_ACCESS,
            formPermissions: undefined,
            submissionPermissions: NO_ACCESS,
            settingsAccessLevel: NO_ACCESS
        };

        const formPermission = permissions.find(item => item.name === FB_ACCESS_FORM);
        if (formPermission) {
            data.formAccessLevel = formPermission.own ? "own" : FULL_ACCESS;
            if (data.formAccessLevel === CUSTOM_ACCESS) {
                data.formPermissions = formPermission.rwd;
            }
            if (formPermission.submissions === true) {
                data.submissionPermissions = FULL_ACCESS;
            }
        }

        const hasSettingsAccess = permissions.find(item => item.name === FB_SETTINGS);

        if (hasSettingsAccess) {
            data.settingsAccessLevel = FULL_ACCESS;
        }

        return data;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => (
                <Fragment>
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
                    {data.accessLevel === CUSTOM_ACCESS && (
                        <Fragment>
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>Forms</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={12}>
                                                <Bind name={`formAccessLevel`}>
                                                    <Select
                                                        label={t`Access Scope`}
                                                        description={
                                                            "The scope of forms a user can access."
                                                        }
                                                    >
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`All forms`}</option>
                                                        <option
                                                            value={"own"}
                                                        >{t`Only forms created by the user`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name={`formPermissions`}>
                                                    <Select
                                                        label={t`Primary Actions`}
                                                        description={
                                                            "Primary actions a user can perform on the forms."
                                                        }
                                                        disabled={
                                                            data.formAccessLevel !== FULL_ACCESS
                                                        }
                                                    >
                                                        <option value={"r"}>{t`Read`}</option>
                                                        <option
                                                            value={"rw"}
                                                        >{t`Read, write`}</option>
                                                        <option
                                                            value={"rwp"}
                                                        >{t`Read, write, publish`}</option>
                                                        <option
                                                            value={"rwd"}
                                                        >{t`Read, write, delete`}</option>
                                                        <option
                                                            value={"rwdp"}
                                                        >{t`Read, write, delete, publish`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name={`submissionPermissions`}>
                                                    <Select
                                                        label={t`Form Submissions`}
                                                        description={
                                                            "The scope of form submissions a user can access."
                                                        }
                                                        disabled={
                                                            !data.formAccessLevel ||
                                                            data.formAccessLevel === NO_ACCESS
                                                        }
                                                    >
                                                        <option value={NO_ACCESS}>{t`None`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`All form submissions`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    </Cell>
                                </Grid>
                            </Elevation>
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Settings`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={12}>
                                                <Bind name={"settingsAccessLevel"}>
                                                    <Select
                                                        label={t`Access Scope`}
                                                        description={
                                                            "The scope of app settings a user can access."
                                                        }
                                                    >
                                                        <option value={NO_ACCESS}>{t`None`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`All settings`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    </Cell>
                                </Grid>
                            </Elevation>
                        </Fragment>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
