import React from "react";
import { get } from "lodash";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Input } from "@webiny/ui/Input";
import { CmsEditorField, CmsEditorFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DateTimeIcon } from "./icons/schedule-black-24px.svg";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
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
        renderSettings({ form: { Bind, data }, contentModel }) {
            const lockedFields = contentModel.lockedFields || [];
            const fieldId = get(data, "fieldId", null);
            const lockedField = lockedFields.find(
                lockedField => lockedField.fieldId === fieldId
            ) as CmsEditorField<{
                formatType: string;
            }>;

            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <Input
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
                                disabled={lockedField && Boolean(lockedField.formatType)}
                            >
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
