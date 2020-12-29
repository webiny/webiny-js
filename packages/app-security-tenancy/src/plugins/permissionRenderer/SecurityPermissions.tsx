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

const t = i18n.ns("app-security-tenancy/plugins/permissionRenderer");

const SECURITY = "security";
const SECURITY_FULL_ACCESS = `${SECURITY}.*`;
const SECURITY_GROUP_ACCESS = `${SECURITY}.group`;
const SECURITY_USER_ACCESS = `${SECURITY}.user`;
const SECURITY_API_KEY_ACCESS = `${SECURITY}.apiKey`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export const SecurityPermissions = ({ parent, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `security*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(SECURITY));
            }

            const permissions = [];
            if (data.level === FULL_ACCESS) {
                permissions.push({ name: SECURITY_FULL_ACCESS });
            } else if (data.level === CUSTOM_ACCESS) {
                if (data.userAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_USER_ACCESS });
                }

                if (data.groupAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_GROUP_ACCESS });
                }

                if (data.apiKeyAccessScope === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_API_KEY_ACCESS });
                }
            }

            if (permissions && permissions.length) {
                newValue.push(...permissions);
            }

            onChange(newValue);
        },
        [parent.id, value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { level: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === SECURITY_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return { level: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(SECURITY));
        if (permissions.length === 0) {
            return { level: NO_ACCESS };
        }

        const data = {
            level: CUSTOM_ACCESS,
            groupAccessScope: NO_ACCESS,
            userAccessScope: NO_ACCESS,
            apiKeyAccessScope: NO_ACCESS
        };

        const hasGroupAccess = permissions.find(item => item.name === SECURITY_GROUP_ACCESS);
        if (hasGroupAccess) {
            data.groupAccessScope = FULL_ACCESS;
        }

        const hasUserAccess = permissions.find(item => item.name === SECURITY_USER_ACCESS);
        if (hasUserAccess) {
            data.userAccessScope = FULL_ACCESS;
        }

        const hasApiKeyAccess = permissions.find(item => item.name === SECURITY_API_KEY_ACCESS);
        if (hasApiKeyAccess) {
            data.apiKeyAccessScope = FULL_ACCESS;
        }

        return data;
    }, [parent.id]);

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
                                    <option value={FULL_ACCESS}>{t`Full access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.level === CUSTOM_ACCESS && (
                        <React.Fragment>
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Users`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"userAccessScope"}>
                                            <Select label={t`Access Scope`}>
                                                <option value={NO_ACCESS}>{t`No access`}</option>
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
                                        <Typography use={"overline"}>{t`Groups`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"groupAccessScope"}>
                                            <Select label={t`Access Scope`}>
                                                <option value={NO_ACCESS}>{t`No access`}</option>
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
                                        <Typography use={"overline"}>{t`API Keys`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"apiKeyAccessScope"}>
                                            <Select label={t`Access Scope`}>
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
                        </React.Fragment>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
