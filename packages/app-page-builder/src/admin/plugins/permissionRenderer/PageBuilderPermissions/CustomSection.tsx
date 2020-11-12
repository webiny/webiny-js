import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo } from "@webiny/app-security-user-management/components/permission";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

const CustomSection = ({ Bind, data, entity, title }) => {
    return (
        <Elevation z={1} style={{ marginTop: 10 }}>
            <Grid>
                <Cell span={12}>
                    <Typography use={"overline"}>{title}</Typography>
                </Cell>
                <Cell span={12}>
                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6} align={"middle"}>
                            <Bind name={`${entity}AccessLevel`}>
                                <Select label={t`Access Level`}>
                                    <option value={"no"}>{t`No access`}</option>
                                    <option value={"full"}>{t`All`}</option>
                                    <option value={"own"}>{t`Only the one they created`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        <Cell span={6}>
                            <PermissionInfo title={t`Permissions`} />
                        </Cell>
                        <Cell span={6} align={"middle"}>
                            <Bind name={`${entity}Rwd`}>
                                <Select
                                    label={t`Permissions`}
                                    disabled={data[`${entity}AccessLevel`] !== "full"}
                                >
                                    <option value={"r"}>{t`Read`}</option>
                                    <option value={"rw"}>{t`Read, write`}</option>
                                    <option value={"rwd"}>{t`Read, write, delete`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};

export default CustomSection;
