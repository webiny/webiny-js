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
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { SecurityPermission } from "@webiny/app-security/types";
import { FormBuilderSecurityPermission } from "~/types";
import { useSecurity } from "@webiny/app-security";
import { AaclPermission } from "@webiny/app-admin";

const t = i18n.ns("app-form-builder/admin/plugins/permissionRenderer");

const FB = "fb";
const FB_FULL_ACCESS = `${FB}.*`;
const FB_ACCESS_FORM = `${FB}.form`;
const FB_SETTINGS = `${FB}.settings`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

const pwOptions = [
    { id: "p", name: t`Publish` },
    { id: "u", name: t`Unpublish` }
    // { id: "r", name: t`Request review` },
    // { id: "c", name: t`Request changes` }
];

interface FormPermissionsData {
    accessLevel: string;
    formAccessLevel: string;
    formRWD: string;
    formPW: string;
    submissionPermissions: string;
    settingsAccessLevel: string;
}

interface FormBuilderPermissionsProps {
    value: string;
    onChange: (value: SecurityPermission[]) => void;
}

export const FormBuilderPermissions = ({ value, onChange }: FormBuilderPermissionsProps) => {
    const { getPermission } = useSecurity();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAAcl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const onFormChange = useCallback(
        (data: FormPermissionsData) => {
            let newValue: FormBuilderSecurityPermission[] = [];
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
            if (data.formAccessLevel && data.formAccessLevel !== NO_ACCESS) {
                const permission: FormBuilderSecurityPermission = {
                    name: FB_ACCESS_FORM,
                    own: false,
                    rwd: undefined,
                    pw: "",
                    submissions: false
                };

                if (data.formAccessLevel === "own") {
                    permission.own = true;
                    permission.rwd = "rwd";
                } else {
                    permission.rwd = data.formRWD || "r";
                }

                if (Array.isArray(data.formPW)) {
                    permission.pw = data.formPW.join("");
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

    const formData = useMemo((): Partial<FormPermissionsData> => {
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
        const data: FormPermissionsData = {
            accessLevel: CUSTOM_ACCESS,
            formAccessLevel: NO_ACCESS,
            formRWD: "",
            formPW: "",
            submissionPermissions: NO_ACCESS,
            settingsAccessLevel: NO_ACCESS
        };

        const formPermission = permissions.find(item => item.name === FB_ACCESS_FORM);
        if (formPermission) {
            data.formAccessLevel = formPermission.own ? "own" : FULL_ACCESS;
            if (data.formAccessLevel === "own") {
                data.formRWD = "rwd";
            } else {
                data.formRWD = formPermission.rwd;
            }

            data.formPW = (formPermission.pw || "").split("");
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
            {({ data, Bind, setValue }) => (
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
                                                <Bind
                                                    name={`formAccessLevel`}
                                                    beforeChange={(value, cb) => {
                                                        if (value === "own") {
                                                            setValue(`formRWD`, "rwd");
                                                        }
                                                        cb(value);
                                                    }}
                                                >
                                                    <Select
                                                        disabled={cannotUseAAcl}
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
                                                <Bind name={`formRWD`}>
                                                    <Select
                                                        label={t`Primary Actions`}
                                                        description={
                                                            "Primary actions a user can perform on the forms."
                                                        }
                                                        disabled={
                                                            cannotUseAAcl ||
                                                            data.formAccessLevel !== FULL_ACCESS
                                                        }
                                                    >
                                                        <option value={"r"}>{t`Read`}</option>
                                                        <option
                                                            value={"rw"}
                                                        >{t`Read, write`}</option>
                                                        <option
                                                            value={"rwd"}
                                                        >{t`Read, write, delete`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name={"formPW"}>
                                                    <CheckboxGroup
                                                        label={t`Publishing actions`}
                                                        description={t`Publishing-related actions that can be performed on the forms.`}
                                                    >
                                                        {({ getValue, onChange }) =>
                                                            pwOptions.map(({ id, name }) => (
                                                                <Checkbox
                                                                    disabled={
                                                                        cannotUseAAcl ||
                                                                        !["full", "own"].includes(
                                                                            data.formAccessLevel
                                                                        )
                                                                    }
                                                                    key={id}
                                                                    label={name}
                                                                    value={getValue(id)}
                                                                    onChange={onChange(id)}
                                                                />
                                                            ))
                                                        }
                                                    </CheckboxGroup>
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
                                                            cannotUseAAcl ||
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
                                                        disabled={cannotUseAAcl}
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
