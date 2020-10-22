import React from "react";
import get from "lodash.get";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { LIST_CONTENT_MODELS } from "@webiny/app-headless-cms/admin/viewsGraphql";
import { LIST_CONTENT_MODEL_GROUPS } from "@webiny/app-headless-cms/admin/views/ContentModelGroups/graphql";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import {
    PermissionSelector,
    PermissionSelectorWrapper
} from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/CmsPermissions/components/PermissionSelector";

import { i18n } from "@webiny/app/i18n";
import { PermissionInfo } from "@webiny/app-security-user-management/components/permission";
import { Elevation } from "@webiny/ui/Elevation";
const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const ContentModelPermission = ({ Bind, data, entity, title }) => {
    // Data fetching
    const {
        data: contentModelData,
        error: contentModelError,
        loading: contentModelLoading
    } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(contentModelData, "listContentModels.data", []).map(contentModel => ({
        id: contentModel.modelId,
        name: contentModel.name
    }));

    const {
        data: contentModelGroupData,
        error: contentModelGroupError,
        loading: contentModelGroupLoading
    } = useQuery(LIST_CONTENT_MODEL_GROUPS);
    const contentModelGroups = get(
        contentModelGroupData,
        "contentModelGroups.data",
        []
    ).map(contentModelGroup => ({ id: contentModelGroup.slug, name: contentModelGroup.name }));

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
                        <Cell span={6}>
                            <Bind name={`${entity}AccessLevel`}>
                                <Select label={t`Access Level`}>
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
                        {data[`${entity}AccessLevel`] === "models" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    Bind={Bind}
                                    entity={entity}
                                    data={data}
                                    selectorKey={"models"}
                                    dataList={{
                                        loading: contentModelLoading,
                                        error: contentModelError,
                                        list: contentModels
                                    }}
                                />
                            </PermissionSelectorWrapper>
                        )}
                        {data[`${entity}AccessLevel`] === "groups" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    Bind={Bind}
                                    entity={entity}
                                    data={data}
                                    selectorKey={"groups"}
                                    dataList={{
                                        loading: contentModelGroupLoading,
                                        error: contentModelGroupError,
                                        list: contentModelGroups
                                    }}
                                />
                            </PermissionSelectorWrapper>
                        )}

                        <Cell span={6}>
                            <PermissionInfo title={t`Permissions`} />
                        </Cell>
                        <Cell span={6} align={"middle"}>
                            <Bind name={`${entity}Permissions`}>
                                <Select
                                    label={t`Permissions`}
                                    disabled={
                                        data[`${entity}AccessLevel`] === "own" ||
                                        data[`${entity}AccessLevel`] === "no"
                                    }
                                >
                                    <option value={"r"}>{t`Read`}</option>
                                    <option value={"rw"}>{t`Read, write`}</option>
                                    <option value={"rwp"}>{t`Read, write, publish`}</option>
                                    <option value={"rwd"}>{t`Read, write, delete`}</option>
                                    <option
                                        value={"rwdp"}
                                    >{t`Read, write, delete, publish`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};
