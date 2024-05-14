import React from "react";
import get from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { CmsModelField, CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DateTimeIcon } from "./icons/schedule-black-24px.svg";
import { useModel, useModelField } from "~/admin/hooks";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

const DateTimeSettings = () => {
    const { model } = useModel();
    const { field } = useModelField();
    const lockedFields = model.lockedFields || [];
    const fieldId = get(field, "fieldId", null);
    const lockedField = lockedFields.find(
        lockedField => lockedField.fieldId === fieldId
    ) as CmsModelField<{
        formatType: string;
    }>;

    return (
        <>
            <Grid>
                <Cell span={6}>
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
                <Cell span={6}>
                    <Bind name={"settings.defaultSetValue"}>
                        <Select
                            label={t`Default Admin UI value`}
                            description={"Affects the Admin UI only"}
                        >
                            <option value={t`null`}>{t`Leave empty (null value)`}</option>
                            <option value={t`current`}>{t`Current date/time`}</option>
                        </Select>
                    </Bind>
                </Cell>
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
