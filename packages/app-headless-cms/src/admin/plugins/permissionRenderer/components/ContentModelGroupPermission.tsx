import React, { useCallback } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";
import { useCmsData } from "./useCmsData";
import { BindComponent } from "@webiny/form/types";
import { CmsSecurityPermission } from "~/types";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface ContentModelGroupPermissionProps {
    Bind: BindComponent;
    data: CmsSecurityPermission;
    entity: string;
    title: string;
    locales: string[];
    disabled?: boolean;
}
const ContentModelGroupPermission = ({
    Bind,
    data,
    entity,
    title,
    locales,
    disabled
}: ContentModelGroupPermissionProps) => {
    const modelsGroups = useCmsData(locales);

    const getItems = useCallback(
        (code: string) => {
            return modelsGroups[code]["groups"];
        },
        [modelsGroups]
    );

    const endpoints = data.endpoints || [];

    const disabledPrimaryActions =
        [undefined, "own", "no"].includes(data[`${entity}AccessScope`]) ||
        !endpoints.includes("manage");

    return (
        <Elevation z={1} style={{ marginTop: 10 }}>
            <Grid>
                <Cell span={12}>
                    <Typography use={"overline"}>{title}</Typography>
                </Cell>
                <Cell span={12}>
                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                        <Cell span={12}>
                            <Bind name={`${entity}AccessScope`} defaultValue={"full"}>
                                <Select label={t`Access Scope`} disabled={disabled}>
                                    <option value={"full"}>{t`All groups`}</option>
                                    <option value={"groups"}>{t`Only specific groups`}</option>
                                    {(endpoints.includes("manage") && (
                                        <option
                                            value={"own"}
                                        >{t`Only groups created by the user`}</option>
                                    )) || <></>}
                                </Select>
                            </Bind>
                        </Cell>
                        {data[`${entity}AccessScope`] === "groups" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    disabled={disabled}
                                    locales={locales}
                                    Bind={Bind}
                                    entity={entity}
                                    selectorKey={"groups"}
                                    getItems={getItems}
                                />
                            </PermissionSelectorWrapper>
                        )}
                        <Cell span={12}>
                            <Bind name={`${entity}RWD`}>
                                <Select
                                    label={t`Primary Actions`}
                                    disabled={disabled || disabledPrimaryActions}
                                >
                                    <option value={"r"}>{t`Read`}</option>
                                    {endpoints.includes("manage") ? (
                                        <option value={"rw"}>{t`Read, write`}</option>
                                    ) : (
                                        <></>
                                    )}
                                    {endpoints.includes("manage") ? (
                                        <option value={"rwd"}>{t`Read, write, delete`}</option>
                                    ) : (
                                        <></>
                                    )}
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};

export default ContentModelGroupPermission;
