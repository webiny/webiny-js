import React from "react";
import { ReactComponent as DateTimeIcon } from "./icons/schedule-black-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-dateTime",
    field: {
        type: "datetime",
        label: t`Date/Time`,
        description: t`Store date and time.`,
        icon: <DateTimeIcon />,
        validators: ["required", "gte", "lte"],
        allowMultipleValues: true,
        allowPredefinedValues: false, // TODO: implement "renderPredefinedValues" and set to true.
        allowIndexes: {
            singleValue: true,
            multipleValues: false
        },
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
        renderSettings({ form: { Bind }, lockedField }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <I18NInput
                                label={t`Placeholder text`}
                                description={t`Placeholder text (optional)`}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"settings.type"}>
                            <Select
                                label={t`Format`}
                                description={t`Cannot be changed later`}
                                disabled={lockedField && lockedField.formatType}
                            >
                                <option value={t`date`}>{t`Date only`}</option>
                                <option value={t`time`}>{t`Time only`}</option>
                                <option value={t`dateTimeWithTimezone`}>
                                    {t`Date and time with timezone`}
                                </option>
                                <option value={t`dateTimeWithoutTimezone`}>
                                    {t`Date and time without timezone`}
                                </option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
