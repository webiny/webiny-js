import React from "react";
import DynamicSection from "../DynamicSection.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { DateTimeWithoutTimezone } from "./DateTimeWithoutTimezone.js";
import { DateTimeWithTimezone } from "./DateTimeWithTimezone.js";
import { DateOnly } from "./DateOnly.js";
import { Time } from "./Time.js";
import { MultiValueRendererSettings } from "~/admin/plugins/fieldRenderers/MultiValueRendererSettings.js";

const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-date-times",
    renderer: {
        rendererName: "date-time-inputs",
        name: t`Date/Time Inputs`,
        description: t`Renders inputs for various formats of dates and times.`,
        canUse({ field }) {
            return !!(field.type === "datetime" && field.list && !field.predefinedValues?.enabled);
        },
        render(props) {
            const { field } = props;

            const fieldSettingsType = field.settings ? field.settings.type : null;

            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => {
                        const trailingIcon = {
                            icon: <DeleteIcon />,
                            onClick: () => bind.field.removeValue(index)
                        };

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
        },
        renderSettings(props) {
            return <MultiValueRendererSettings {...props} />;
        }
    }
};

export default plugin;
