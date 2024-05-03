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
import { SecurityPermission } from "@webiny/app-security/types";
import { useSecurity } from "@webiny/app-security";
import { AaclPermission, useWcp } from "@webiny/app-admin";

const t = i18n.ns("app-security-admin-users/plugins/permissionRenderer");

const SECURITY = "security";
const SECURITY_FULL_ACCESS = `${SECURITY}.*`;
const SECURITY_GROUP_ACCESS = `${SECURITY}.group`;
const SECURITY_TEAM_ACCESS = `${SECURITY}.team`;
const SECURITY_API_KEY_ACCESS = `${SECURITY}.apiKey`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

interface SecurityPermissionsProps {
    value: SecurityPermission[];
    onChange: (value: SecurityPermission[]) => void;
}

export const SecurityPermissions = ({ value, onChange }: SecurityPermissionsProps) => {
    const { getPermission } = useSecurity();
    const { getProject } = useWcp();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAacl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const project = getProject();
    let teams = false;
    if (project) {
        teams = project.package.features.advancedAccessControlLayer.options.teams;
    }

    const onFormChange = useCallback(
        (formData: SecurityPermission) => {
            let newValue: SecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `security*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(SECURITY));
            }

            const permissions = [];
            if (formData.accessLevel === FULL_ACCESS) {
                permissions.push({ name: SECURITY_FULL_ACCESS });
            } else if (formData.accessLevel === CUSTOM_ACCESS) {
                if (formData.groupAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_GROUP_ACCESS });
                }

                if (formData.teamAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_TEAM_ACCESS });
                }

                if (formData.apiKeyAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_API_KEY_ACCESS });
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
            item => item.name === SECURITY_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(SECURITY));
        if (permissions.length === 0) {
            return { accessLevel: NO_ACCESS };
        }

        const data = {
            accessLevel: CUSTOM_ACCESS,
            groupAccessScope: NO_ACCESS,
            teamAccessScope: NO_ACCESS,
            apiKeyAccessScope: NO_ACCESS
        };

        const hasGroupAccess = permissions.find(item => item.name === SECURITY_GROUP_ACCESS);
        if (hasGroupAccess) {
            data.groupAccessScope = FULL_ACCESS;
        }
        const hasTeamAccess = permissions.find(item => item.name === SECURITY_TEAM_ACCESS);
        if (hasTeamAccess) {
            data.teamAccessScope = FULL_ACCESS;
        }

        const hasApiKeyAccess = permissions.find(item => item.name === SECURITY_API_KEY_ACCESS);
        if (hasApiKeyAccess) {
            data.apiKeyAccessScope = FULL_ACCESS;
        }

        return data;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => {
                return (
                    <Fragment>
                        <Grid className={gridNoPaddingClass}>
                            <Cell span={12}>
                                {data.accessLevel === "custom" && cannotUseAacl && (
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
                            <React.Fragment>
                                <Elevation z={1} style={{ marginTop: 10 }}>
                                    <Grid>
                                        <Cell span={12}>
                                            <Typography use={"overline"}>{t`API Keys`}</Typography>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind name={"apiKeyAccessScope"}>
                                                <Select
                                                    label={t`Access Scope`}
                                                    disabled={cannotUseAacl}
                                                >
                                                    <option
                                                        value={NO_ACCESS}
                                                    >{t`No access`}</option>
                                                    <option
                                                        value={FULL_ACCESS}
                                                    >{t`Full access`}</option>
                                                </Select>
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </Elevation>
                                <Elevation z={1} style={{ marginTop: 10 }}>
                                    <Grid>
                                        <Cell span={12}>
                                            <Typography use={"overline"}>{t`Roles`}</Typography>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind name={"groupAccessScope"}>
                                                <Select
                                                    label={t`Access Scope`}
                                                    disabled={cannotUseAacl}
                                                >
                                                    <option
                                                        value={NO_ACCESS}
                                                    >{t`No access`}</option>
                                                    <option
                                                        value={FULL_ACCESS}
                                                    >{t`Full access`}</option>
                                                </Select>
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </Elevation>
                                {teams && (
                                    <Elevation z={1} style={{ marginTop: 10 }}>
                                        <Grid>
                                            <Cell span={12}>
                                                <Typography use={"overline"}>{t`Teams`}</Typography>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name={"teamAccessScope"}>
                                                    <Select
                                                        label={t`Access Scope`}
                                                        disabled={cannotUseAacl}
                                                    >
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
                                                        >{t`Full access`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    </Elevation>
                                )}
                            </React.Fragment>
                        )}
                    </Fragment>
                );
            }}
        </Form>
    );
};
