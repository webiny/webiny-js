import React from "react";
import get from "lodash/get";
import DynamicSection from "../DynamicSection";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import { DateTimeWithoutTimezone } from "./DateTimeWithoutTimezone";
import { DateTimeWithTimezone } from "./DateTimeWithTimezone";
import { DateOnly } from "./DateOnly";
import { Time } from "./Time";

const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-date-times",
    renderer: {
        rendererName: "date-time-inputs",
        name: t`Date/Time Inputs`,
        description: t`Renders inputs for various formats of dates and times.`,
        canUse({ field }) {
            return !!(
                field.type === "datetime" &&
                field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const { field } = props;

            const fieldSettingsType = field.settings ? field.settings.type : null;

            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => {
                        let trailingIcon = undefined;
                        if (index > 0) {
                            trailingIcon = {
                                icon: <DeleteIcon />,
                                onClick: () => bind.field.removeValue(index)
                            };
                        }

                        if (fieldSettingsType === "dateTimeWithoutTimezone") {
                            return (
                                <DateTimeWithoutTimezone
                                    field={field}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }
                        if (fieldSettingsType === "dateTimeWithTimezone") {
                            return (
                                <DateTimeWithTimezone
                                    field={field}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }
                        if (fieldSettingsType === "time") {
                            return (
                                <Time
                                    field={{
                                        ...props.field,
                                        label:
                                            props.field.label +
                                            t` Value {number}`({ number: index + 1 })
                                    }}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }

                        return (
                            <DateOnly
                                bind={bind.index}
                                field={{
                                    ...props.field,
                                    label:
                                        props.field.label +
                                        t` Value {number}`({ number: index + 1 })
                                }}
                                trailingIcon={trailingIcon}
                            />
                        );
                    }}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
