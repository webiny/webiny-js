import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { BindComponent } from "@webiny/form/types";

const t = i18n.ns("app-page-builder/admin/plugins/permission-renderer");

interface CustomSectionProps {
    Bind: BindComponent;
    data: Record<string, string>;
    entity: string;
    setValue: (permission: string, type: string) => void;
    title: string;
    disabled?: boolean;
    children?: React.ReactNode;
}

const CustomSection = ({
    Bind,
    data,
    entity,
    setValue,
    title,
    disabled,
    children = null
}: CustomSectionProps) => {
    const rwdSelectEnabled = ["full"].includes(data[`${entity}AccessScope`]);

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
                                beforeChange={(value: string, cb: (value: string) => void) => {
                                    if (value === "own") {
                                        setValue(`${entity}RWD`, "rwd");
                                    }
                                    cb(value);
                                }}
                            >
                                <Select
                                    disabled={disabled}
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
                            <Bind name={`${entity}RWD`}>
                                <Select
                                    disabled={disabled || !rwdSelectEnabled}
                                    label={t`Primary actions`}
                                    description={t`Primary actions that can be performed on the content.`}
                                >
                                    <option value={"r"}>{t`Read`}</option>
                                    <option value={"rw"}>{t`Read, write`}</option>
                                    <option value={"rwd"}>{t`Read, write, delete`}</option>
                                </Select>
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
