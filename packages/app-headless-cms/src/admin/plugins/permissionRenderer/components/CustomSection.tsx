import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const CustomSection = ({ Bind, data, entity, title }) => {
    return (
        <Elevation z={1} style={{ marginTop: 10 }}>
            <Grid>
                <Cell span={12}>
                    <Typography use={"overline"}>{title}</Typography>
                </Cell>
                <Cell span={12}>
                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                        <Cell span={12}>
                            <Bind name={`${entity}AccessScope`}>
                                <Select label={t`Access Scope`}>
                                    <option value={"no"}>{t`No access`}</option>
                                    <option value={"full"}>{t`All`}</option>
                                    <option value={"own"}>{t`Only the ones they created`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind name={`${entity}RWD`}>
                                <Select
                                    label={t`Primary Actions`}
                                    disabled={data[`${entity}AccessScope`] !== "full"}
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
