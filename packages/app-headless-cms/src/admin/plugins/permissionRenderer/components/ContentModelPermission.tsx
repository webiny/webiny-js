import React, { useCallback, useEffect } from "react";
import get from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";
import { useCmsData, CmsDataCmsModel } from "./useCmsData";
import { Note } from "./StyledComponents";
import ContentModelList from "./ContentModelList";
import { BindComponent } from "@webiny/form/types";
import { CmsSecurityPermission } from "~/types";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface ContentModelPermissionProps {
    Bind: BindComponent;
    data: CmsSecurityPermission;
    setValue: (name: string, value: string) => void;
    entity: string;
    title: string;
    locales: string[];
    selectedContentModelGroups?: Record<string, string[]>;
    disabled?: boolean;
}
export const ContentModelPermission = ({
    Bind,
    data,
    setValue,
    entity,
    title,
    locales,
    selectedContentModelGroups = {},
    disabled
}: ContentModelPermissionProps) => {
    const modelsGroups = useCmsData(locales);
    // Set "cms.contentModel" access scope to "own" if "cms.contentModelGroup" === "own".
    useEffect(() => {
        if (
            get(data, `contentModelGroupAccessScope`) === "own" &&
            get(data, `${entity}AccessScope`) !== "own"
        ) {
            setValue(`${entity}AccessScope`, "own");
        }
    }, [data]);

    const getItems = useCallback(
        (code: string): CmsDataCmsModel[] => {
            let list = get(modelsGroups, `${code}.models`, []) as CmsDataCmsModel[];

            const groups: string[] = selectedContentModelGroups[code] || [];
            if (groups.length) {
                // Filter by groups
                list = list.filter(item => groups.includes(item.group.id));
            }

            return list;
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
                                <Select
                                    label={t`Access Scope`}
                                    disabled={
                                        disabled || data[`contentModelGroupAccessScope`] === "own"
                                    }
                                    description={t`The list of available models is defined by the options set in the content model groups section above.`}
                                >
                                    <option value={"full"}>{t`All models`}</option>
                                    <option value={"models"}>{t`Only specific models`}</option>
                                    {(endpoints.includes("manage") && (
                                        <option
                                            value={"own"}
                                        >{t`Only models created by the user`}</option>
                                    )) || <></>}
                                </Select>
                            </Bind>
                            {data[`contentModelGroupAccessScope`] === "own" && (
                                <Note>
                                    <Typography use={"caption"}>
                                        <span className={"highlight"}>Content Model</span>
                                        &nbsp;{t`access depends upon`}&nbsp;
                                        <span className={"highlight"}>Content Model Group</span>
                                    </Typography>
                                </Note>
                            )}
                        </Cell>
                        {data[`${entity}AccessScope`] === "models" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
                                    disabled={disabled}
                                    locales={locales}
                                    Bind={Bind}
                                    entity={entity}
                                    selectorKey={"models"}
                                    getItems={getItems}
                                    RenderItems={ContentModelList}
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
