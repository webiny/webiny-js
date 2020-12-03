import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

const rwdOptions = [
    { id: "r", name: t`Read` },
    { id: "w", name: t`Write` },
    { id: "d", name: t`Delete` }
];

const CustomSection = ({ Bind, data, entity, title, children = null }) => {
    const rwdCheckboxesEnabled = ["full", "own"].includes(data[`${entity}AccessLevel`]);

    return (
        <Elevation z={1} style={{ marginTop: 10 }}>
            <Grid>
                <Cell span={12}>
                    <Typography use={"overline"}>{title}</Typography>
                </Cell>
                <Cell span={12}>
                    <Grid style={{ padding: 0, paddingBottom: 24 }}>
                        <Cell span={6}>
                            <Bind name={`${entity}AccessLevel`}>
                                <Select
                                    label={t`Access Scope`}
                                    description={t`The scope of the content that can be accessed.`}
                                >
                                    <option value={"no"}>{t`None`}</option>
                                    <option value={"full"}>{t`All content`}</option>
                                    <option
                                        value={"own"}
                                    >{t`Only content created by the user`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind name={`${entity}Rwd`}>
                                <CheckboxGroup
                                    label={t`Primary actions`}
                                    description={t`Primary actions that can be performed on the content.`}
                                >
                                    {({ getValue, onChange }) =>
                                        rwdOptions.map(({ id, name }) => (
                                            <Checkbox
                                                disabled={!rwdCheckboxesEnabled}
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
                        {children}
                    </Grid>
                </Cell>
            </Grid>
        </Elevation>
    );
};

export default CustomSection;
