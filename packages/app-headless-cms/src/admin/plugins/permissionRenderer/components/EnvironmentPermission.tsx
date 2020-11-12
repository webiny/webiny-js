import React from "react";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo } from "@webiny/app-security-user-management/components/permission";
import { Elevation } from "@webiny/ui/Elevation";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const EnvironmentPermission = ({ Bind, data, entity }) => {
    // Data fetching
    const { environments } = useCms();
    const list = (environments?.environments || []).map(item => ({
        id: item.slug,
        name: item.name
    }));

    return (
        <Elevation z={1} style={{ marginTop: 10 }}>
            <Grid>
                <Cell span={12}>
                    <Typography use={"overline"}>{t`Environments Access`}</Typography>
                </Cell>
                <Cell span={12}>
                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={`${entity}AccessLevel`}>
                                <Select label={t`Access Level`}>
                                    <option value={"full"}>{t`All`}</option>
                                    <option value={entity}>{t`Only specific environments`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        {data[`${entity}AccessLevel`] === entity && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    Bind={Bind}
                                    entity={"environments"}
                                    data={data}
                                    selectorKey={"environments"}
                                    dataList={{
                                        loading: false,
                                        error: null,
                                        list: list
                                    }}
                                />
                            </PermissionSelectorWrapper>
                        )}
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};
