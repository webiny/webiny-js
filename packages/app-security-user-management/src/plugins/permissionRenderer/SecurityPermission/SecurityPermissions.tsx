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

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer");

const SECURITY = "security";
const SECURITY_FULL_ACCESS = `${SECURITY}.*`;
const SECURITY_GROUP_ACCESS = `${SECURITY}.group.manage`;
const SECURITY_USER_ACCESS = `${SECURITY}.user.manage`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";

export const SecurityPermissions = ({ securityGroup, value, onChange }) => {
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
                if (data.userAccessLevel === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_USER_ACCESS });
                }
                if (data.groupAccessLevel === FULL_ACCESS) {
                    permissions.push({ name: SECURITY_GROUP_ACCESS });
                }
            }

            if (permissions && permissions.length) {
                newValue.push(...permissions);
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
            item => item.name === SECURITY_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { level: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(SECURITY));
        if (!permissions) {
            return { level: NO_ACCESS };
        }

        const data = {
            level: CUSTOM_ACCESS,
            groupAccessLevel: NO_ACCESS,
            userAccessLevel: NO_ACCESS
        };

        const hasGroupAccess = permissions.find(item => item.name === SECURITY_GROUP_ACCESS);
        if (hasGroupAccess) {
            data.groupAccessLevel = FULL_ACCESS;
        }

        const hasUserAccess = permissions.find(item => item.name === SECURITY_USER_ACCESS);
        if (hasUserAccess) {
            data.userAccessLevel = FULL_ACCESS;
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
                        <React.Fragment>
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Users`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage users`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"userAccessLevel"}>
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
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Groups`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage groups`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"groupAccessLevel"}>
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
                        </React.Fragment>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
