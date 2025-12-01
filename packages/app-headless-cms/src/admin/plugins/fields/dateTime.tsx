import React from "react";

import type { CmsModelFieldTypePlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DateTimeIcon } from "./icons/schedule-black-24px.svg";
import { Bind } from "@webiny/form";
import { Grid, Label, Select } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields");

const DateTimeSettings = () => {
    return (
        <>
            <Grid>
                <Grid.Column span={6}>
                    <Bind name={"settings.type"}>
                        <Select
                            label={
                                <Label
                                    text={t`Format`}
                                    description={t`(cannot be changed later)`}
                                />
                            }
                            options={[
                                { value: "date", label: t`Date only` },
                                { value: "time", label: t`Time only` },
                                {
                                    value: "dateTimeWithTimezone",
                                    label: t`Date and time with timezone`
                                },
                                {
                                    value: "dateTimeWithoutTimezone",
                                    label: t`Date and time without timezone`
                                }
                            ]}
                            size={"lg"}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Bind name={"settings.defaultSetValue"}>
                        <Select
                            label={
                                <Label
                                    text={t`Default Admin UI value`}
                                    hint={t`Affects the Admin UI only`}
                                />
                            }
                            options={[
                                { value: t`null`, label: t`Leave empty (null value)` },
                                { value: t`current`, label: t`Current date/time` }
                            ]}
                            size={"lg"}
                        />
                    </Bind>
                </Grid.Column>
            </Grid>
        </>
    );
};

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-dateTime",
    field: {
        type: "datetime",
        label: t`Date/Time`,
        description: t`Store date and time.`,
        icon: <DateTimeIcon />,
        validators: ["required", "dateGte", "dateLte"],
        allowMultipleValues: true,
        allowPredefinedValues: false, // TODO: implement "renderPredefinedValues" and set to true.
        multipleValuesLabel: t`Use as a list of dates and times`,
        createField() {
            return {
                type: this.type,
                settings: {
                    type: "date"
                },
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings() {
            return <DateTimeSettings />;
        }
    }
};

export default plugin;
