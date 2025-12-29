import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Select } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    CannotUseAaclAlert,
    PermissionInfo,
    gridWithPaddingClass,
    PermissionsGroup,
    type AaclPermission
} from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { useSecurity } from "@webiny/app-admin";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

const FILE_MANAGER = "fm";
const FILE_MANAGER_FULL_ACCESS = `${FILE_MANAGER}.*`;
const FILE_MANAGER_ACCESS_FILE = `${FILE_MANAGER}.file`;
const FILE_MANAGER_ACCESS_SETTINGS = `${FILE_MANAGER}.settings`;

const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

interface FileManagerPermission {
    name: string;
    own?: boolean;
    rwd?: string;
}
interface FileManagerPermissionItem {
    settingsAccessScope?: string;
    filesAccessScope?: string;
    accessLevel?: string;
    name?: string;
    filesRWD?: string;
}
interface FileManagerPermissionsProps {
    value: FileManagerPermissionItem;
    onChange: (value: FileManagerPermissionItem[]) => void;
}

export const FileManagerPermissions = ({ value, onChange }: FileManagerPermissionsProps) => {
    const { getPermission } = useSecurity();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAAcl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const onFormChange = useCallback(
        (data: FileManagerPermissionItem) => {
            let newValue: FileManagerPermissionItem[] = [];
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
            if (data.filesAccessScope && data.filesAccessScope !== NO_ACCESS) {
                const permission: FileManagerPermission = {
                    name: FILE_MANAGER_ACCESS_FILE,
                    own: false,
                    rwd: undefined
                };

                if (data.filesAccessScope === "own") {
                    permission.own = true;
                    permission.rwd = "rwd";
                } else {
                    permission.rwd = data.filesRWD || "r";
                }
                newValue.push(permission);
            }

            // Settings second.
            if (data.settingsAccessScope === FULL_ACCESS) {
                newValue.push({ name: FILE_MANAGER_ACCESS_SETTINGS });
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo((): FileManagerPermissionItem => {
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

        const data: FileManagerPermissionItem = {
            accessLevel: CUSTOM_ACCESS,
            filesAccessScope: NO_ACCESS,
            settingsAccessScope: NO_ACCESS,
            filesRWD: "r"
        };

        const filesPermission = permissions.find(item => item.name === FILE_MANAGER_ACCESS_FILE);
        if (filesPermission) {
            data.filesAccessScope = filesPermission.own ? "own" : FULL_ACCESS;
            if (data.filesAccessScope === FULL_ACCESS) {
                data.filesRWD = filesPermission.rwd;
            } else {
                data.filesRWD = "rwd";
            }
        }

        const hasSettingsAccess = permissions.find(
            item => item.name === FILE_MANAGER_ACCESS_SETTINGS
        );
        if (hasSettingsAccess) {
            data.settingsAccessScope = FULL_ACCESS;
        }

        return data;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind, setValue }) => (
                <Fragment>
                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={12}>
                            {data.accessLevel === "custom" && cannotUseAAcl && (
                                <CannotUseAaclAlert />
                            )}
                        </Grid.Column>
                    </Grid>
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
                                        },
                                        {
                                            value: CUSTOM_ACCESS,
                                            label: t`Custom access`
                                        }
                                    ]}
                                />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                    {data.accessLevel === "custom" && (
                        <div className={"mt-lg"}>
                            <PermissionsGroup title={t`Files`}>
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name={"filesAccessScope"}
                                            beforeChange={(value, cb) => {
                                                if (value === "own") {
                                                    setValue(`filesRWD`, "rwd");
                                                }
                                                cb(value);
                                            }}
                                        >
                                            <Select
                                                label={t`Access Scope`}
                                                disabled={cannotUseAAcl}
                                                options={[
                                                    {
                                                        value: NO_ACCESS,
                                                        label: t`No access`
                                                    },
                                                    {
                                                        value: FULL_ACCESS,
                                                        label: t`Full access`
                                                    },
                                                    {
                                                        value: "own",
                                                        label: t`Only files created by the user`
                                                    }
                                                ]}
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind name={"filesRWD"}>
                                            <Select
                                                label={t`Primary Actions`}
                                                disabled={
                                                    cannotUseAAcl ||
                                                    data.filesAccessScope !== "full"
                                                }
                                                options={[
                                                    {
                                                        value: "r",
                                                        label: t`Read`
                                                    },
                                                    {
                                                        value: "rw",
                                                        label: t`Read, write`
                                                    },
                                                    {
                                                        value: "rwd",
                                                        label: t`Read, write, delete`
                                                    }
                                                ]}
                                            />
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </PermissionsGroup>
                            <PermissionsGroup title={t`Settings`}>
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind name={"settingsAccessScope"}>
                                            <Select
                                                disabled={cannotUseAAcl}
                                                label={t`Access Scope`}
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
                            </PermissionsGroup>
                        </div>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
