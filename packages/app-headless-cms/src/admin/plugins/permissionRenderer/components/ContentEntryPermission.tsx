import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { PermissionSelector, PermissionSelectorWrapper } from "./PermissionSelector";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { useCmsData } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/useCmsData";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const pwOptions = [
    { id: "p", name: t`Publish` },
    { id: "u", name: t`Unpublish` }
    // { id: "r", name: t`Request review` },
    // { id: "c", name: t`Request changes` }
];

export const ContentEntryPermission = ({ Bind, data, entity, setValue, title, locales }) => {
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
                            <Bind
                                name={`${entity}AccessScope`}
                                beforeChange={(value, cb) => {
                                    if (value === "own") {
                                        setValue(`${entity}RWD`, "rwd");
                                    }
                                    cb(value);
                                }}
                            >
                                <Select label={t`Access Scope`}>
                                    <option value={"no"}>{t`No access`}</option>
                                    <option value={"full"}>{t`All entries`}</option>
                                    <option
                                        value={"own"}
                                    >{t`Only entries created by the user`}</option>
                                    <option
                                        value={"models"}
                                    >{t`Only entries in specific content models`}</option>
                                    <option
                                        value={"groups"}
                                    >{t`Only entries in specific groups`}</option>
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
                                    {data.endpoints.includes("manage") ? (
                                        <option value={"rw"}>{t`Read, write`}</option>
                                    ) : null}
                                    {data.endpoints.includes("manage") ? (
                                        <option value={"rwd"}>{t`Read, write, delete`}</option>
                                    ) : null}
                                </Select>
                            </Bind>
                        </Cell>
                        {data.endpoints.includes("manage") ? (
                            <Cell span={12}>
                                <Bind name={`${entity}PW`}>
                                    <CheckboxGroup
                                        label={t`Publishing actions`}
                                        description={t`Publishing-related actions that can be performed on content entries.`}
                                    >
                                        {({ getValue, onChange }) =>
                                            pwOptions.map(({ id, name }) => (
                                                <Checkbox
                                                    disabled={[undefined, "no"].includes(
                                                        data[`${entity}AccessScope`]
                                                    )}
                                                    key={id}
                                                    label={name}
                                                    value={getValue(id)}
                                                    onChange={onChange(id)}
                                                />
                                            ))
                                        }
                                    </CheckboxGroup>
                                </Bind>
                            </Cell>
                        ) : null}
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};
