import React, { useCallback, useEffect } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";
import { useCmsData } from "./useCmsData";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const CustomSection = ({ Bind, data, entity, title, locales, setValue, form }) => {
    const modelsGroups = useCmsData(locales);

    const getItems = useCallback(
        (code: string) => {
            return modelsGroups[code]["groups"];
        },
        [modelsGroups]
    );

    useEffect(() => {
        // Let's set default values for "accessScopes"
        if (
            data.endpoints.length > 0 &&
            !data[`${entity}AccessScope`] &&
            form.onChangeFns[`${entity}AccessScope`]
        ) {
            setValue(`${entity}AccessScope`, "full");
        }
    }, [data, setValue, form]);

    const disabledPrimaryActions =
        [undefined, "own", "no"].includes(data[`${entity}AccessScope`]) ||
        !data.endpoints.includes("manage");

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
                                    <option value={"full"}>{t`All`}</option>
                                    {data.endpoints.includes("manage") && (
                                        <option
                                            value={"own"}
                                        >{t`Only the ones they created`}</option>
                                    )}
                                    <option
                                        value={"groups"}
                                    >{t`Only specific content model groups`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        {data[`${entity}AccessScope`] === "groups" && (
                            <PermissionSelectorWrapper>
                                <PermissionSelector
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
                                    disabled={disabledPrimaryActions}
                                >
                                    <option value={"r"}>{t`Read`}</option>
                                    {data.endpoints.includes("manage") ? (
                                        <option value={"rw"}>{t`Read, write`}</option>
                                    ) : null}
                                    {data.endpoints.includes("manage") ? (
                                        <option value={"rwd"}>{t`Read, write, delete`}</option>
                                    ) : null}
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
