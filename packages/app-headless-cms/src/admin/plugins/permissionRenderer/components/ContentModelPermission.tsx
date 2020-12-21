import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";
import { useCmsData } from "./useCmsData";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const ContentModelPermission = ({ Bind, data, entity, title, locales }) => {
    const modelsGroups = useCmsData(locales);
    
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
                                    <option value={"own"}>{t`Only the one they created`}</option>
                                    <option
                                        value={"models"}
                                    >{t`Only specific content models`}</option>
                                    <option
                                        value={"groups"}
                                    >{t`Only content models in specific groups`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        {data[`${entity}AccessScope`] === "models" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    locales={locales}
                                    Bind={Bind}
                                    entity={entity}
                                    selectorKey={"models"}
                                    cmsData={modelsGroups}
                                />
                            </PermissionSelectorWrapper>
                        )}
                        {data[`${entity}AccessScope`] === "groups" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    locales={locales}
                                    Bind={Bind}
                                    entity={entity}
                                    selectorKey={"groups"}
                                    cmsData={modelsGroups}
                                />
                            </PermissionSelectorWrapper>
                        )}

                        <Cell span={12}>
                            <Bind name={`${entity}RWD`}>
                                <Select
                                    label={t`Primary Actions`}
                                    disabled={[undefined, "own", "no"].includes(
                                        data[`${entity}AccessScope`]
                                    )}
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
