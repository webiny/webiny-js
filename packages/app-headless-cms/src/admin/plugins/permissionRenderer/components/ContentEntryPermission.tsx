import React, { useEffect } from "react";
import get from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { Note } from "./StyledComponents";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const pwOptions = [
    { id: "p", name: t`Publish` },
    { id: "u", name: t`Unpublish` },
    { id: "r", name: t`Request review` },
    { id: "c", name: t`Request changes` }
];

export const ContentEntryPermission = ({ Bind, data, entity, setValue, title }) => {
    // Set "cms.contentEntry" access scope to "own" if "cms.contentModel" === "own".
    useEffect(() => {
        if (
            get(data, `contentModelAccessScope`) === "own" &&
            get(data, `${entity}AccessScope`) !== "own"
        ) {
            setValue(`${entity}AccessScope`, "own");
        }
    }, [data]);

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
                            <Bind
                                defaultValue={"full"}
                                name={`${entity}AccessScope`}
                                beforeChange={(value, cb) => {
                                    if (value === "own") {
                                        setValue(`${entity}RWD`, "rwd");
                                    }
                                    cb(value);
                                }}
                            >
                                <Select
                                    label={t`Access Scope`}
                                    disabled={data[`contentModelAccessScope`] === "own"}
                                >
                                    <option value={"full"}>{t`All entries`}</option>
                                    {data.endpoints.includes("manage") && (
                                        <option
                                            value={"own"}
                                        >{t`Only entries created by the user`}</option>
                                    )}
                                </Select>
                            </Bind>
                            {data[`contentModelAccessScope`] === "own" && (
                                <Note>
                                    <Typography use={"caption"}>
                                        <span className={"highlight"}>Content Entry</span>
                                        &nbsp;{t`access depends upon`}&nbsp;
                                        <span className={"highlight"}>Content Model</span>
                                    </Typography>
                                </Note>
                            )}
                        </Cell>

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
