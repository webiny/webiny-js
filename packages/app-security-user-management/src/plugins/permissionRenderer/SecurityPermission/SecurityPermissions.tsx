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

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer");

const SECURITY_FULL_ACCESS = "security.*";
const SECURITY = "security";

export const SecurityPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `security*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(SECURITY));
            }

            const permissions = [];
            if (data.level === "full") {
                permissions.push({ name: SECURITY_FULL_ACCESS });
            } else if (data.level === "custom") {
                if (data.users) {
                    permissions.push({ name: "security.users.manage" });
                }
                if (data.groups) {
                    permissions.push({ name: "security.groups.manage" });
                }
            }

            if (permissions && permissions.length) {
                newValue.push(...permissions);
            }

            onChange(newValue);
        },
        [securityGroup.id]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { level: "no" };
        }

        const fullAccess = value.find(
            item => item.name === SECURITY_FULL_ACCESS || item.name === "*"
        );
        if (fullAccess) {
            return { level: "full" };
        }

        const permissions = value.filter(item => item.name.startsWith(SECURITY));
        if (!permissions) {
            return { level: "no" };
        }

        const groups = permissions.find(item => item.name === "security.groups.manage");
        const users = permissions.find(item => item.name === "security.users.manage");

        return { level: "custom", users, groups };
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
                                    <option value={"no"}>{t`No access`}</option>
                                    <option value={"full"}>{t`Full Access`}</option>
                                    <option value={"custom"}>{t`Custom`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.level === "custom" && (
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
                                                <Bind name={"users"}>
                                                    <Switch />
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
                                                <Bind name={"groups"}>
                                                    <Switch />
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
