import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";

import {
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-security-user-management/components/permission";
import { Form } from "@webiny/form";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const FILE_MANAGER = "files";
const FILE_MANAGER_FULL_ACCESS = `${FILE_MANAGER}.*`;
const FILE_MANAGER_ACCESS_FILE = `${FILE_MANAGER}.file`;
const FILE_MANAGER_ACCESS_SETTINGS = `${FILE_MANAGER}.settings`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export const FileManagerPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `file-manager*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(FILE_MANAGER));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: FILE_MANAGER_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Files first.
            if (data.filesAccessLevel && data.filesAccessLevel !== NO_ACCESS) {
                const permission = {
                    name: FILE_MANAGER_ACCESS_FILE,
                    own: false,
                    permissions: undefined
                };
                if (data.filesAccessLevel === "own") {
                    permission.own = true;
                } else {
                    permission.permissions = data.filesPermissions;
                }
                newValue.push(permission);
            }

            // Settings second.
            if (data.settingsAccessLevel === FULL_ACCESS) {
                newValue.push({ name: FILE_MANAGER_ACCESS_SETTINGS });
            }

            onChange(newValue);
        },
        [securityGroup.id, value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === FILE_MANAGER_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(FILE_MANAGER));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        const data = {
            accessLevel: CUSTOM_ACCESS,
            filesAccessLevel: NO_ACCESS,
            settingsAccessLevel: NO_ACCESS,
            filesPermissions: "r"
        };

        const filesPermission = permissions.find(item => item.name === FILE_MANAGER_ACCESS_FILE);
        if (filesPermission) {
            data.filesAccessLevel = filesPermission.own ? "own" : FULL_ACCESS;
            if (data.filesAccessLevel === FULL_ACCESS) {
                data.filesPermissions = filesPermission.permissions;
            }
        }

        const hasSettingsAccess = permissions.find(
            item => item.name === FILE_MANAGER_ACCESS_SETTINGS
        );
        if (hasSettingsAccess) {
            data.settingsAccessLevel = FULL_ACCESS;
        }

        return data;
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
                            <Bind name={"accessLevel"}>
                                <Select label={t`Access Level`}>
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full Access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom Access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === "custom" && (
                        <Fragment>
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Files`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Access Level`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"filesAccessLevel"}>
                                                    <Select label={t`Access Level`}>
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`All files`}</option>
                                                        <option
                                                            value={"own"}
                                                        >{t`Only the one they created`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Permissions`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"filesPermissions"}>
                                                    <Select
                                                        label={t`Permissions`}
                                                        disabled={data.filesAccessLevel !== "full"}
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
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage settings`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"settingsAccessLevel"}>
                                                    <Select label={t`Access Level`}>
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`Full Access`}</option>
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
