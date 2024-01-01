import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as DateIcon } from "@material-design-icons/svg/round/calendar_month.svg";
import { FbBuilderFieldPlugin } from "~/types";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-date-time",
    field: {
        type: "datetime",
        name: "date",
        validators: ["required", "dateGte", "dateLte"],
        label: "Date/Time",
        description: "Renders input for various formats of date and time.",
        icon: <DateIcon />,
        createField() {
            return {
                _id: "",
                fieldId: "",
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: "",
                    format: "date"
                }
            };
        },
        renderSettings({ form }) {
            const { Bind } = form;
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.format"}>
                            <Select label={t`Format`} description={t`Cannot be changed later`}>
                                <option value={t`date`}>{t`Date only`}</option>
                                <option value={t`time`}>{t`Time only`}</option>
                                <option
                                    value={t`dateTimeWithTimezone`}
                                >{t`Date and time with timezone`}</option>
                                <option
                                    value={t`dateTimeWithoutTimezone`}
                                >{t`Date and time without timezone`}</option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
