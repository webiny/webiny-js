import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import DateTimeWithoutTimezone from "./DateTimeWithoutTimezone";
import DateTimeWithTimezone from "./DateTimeWithTimezone";
import Time from "./Time";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/date-time");
import get from "lodash/get";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import DynamicListMultipleValues from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/DynamicListMultipleValues";

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-date-times",
    renderer: {
        rendererName: "date-time-inputs",
        name: t`Date/Time Inputs`,
        description: t`Renders inputs for various formats of dates and times.`,
        canUse({ field }) {
            return (
                field.type === "datetime" &&
                field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const field = props.field;

            return (
                <DynamicListMultipleValues {...props}>
                    {({ bind, index }) => {
                        const trailingIcon = index > 0 && {
                            icon: <DeleteIcon />,
                            onClick: bind.index.removeValue
                        };

                        if (field.settings.type === "dateTimeWithoutTimezone") {
                            return (
                                <DateTimeWithoutTimezone
                                    field={field}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }
                        if (field.settings.type === "dateTimeWithTimezone") {
                            return (
                                <DateTimeWithTimezone
                                    field={field}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }
                        if (field.settings.type === "time") {
                            return (
                                <Time
                                    field={field}
                                    bind={bind.index}
                                    label={t`Value {number}`({ number: index + 1 })}
                                    trailingIcon={trailingIcon}
                                />
                            );
                        }

                        return (
                            <Input
                                {...bind.index}
                                type={field.settings.type}
                                label={t`Value {number}`({ number: index + 1 })}
                                trailingIcon={trailingIcon}
                            />
                        );
                    }}
                </DynamicListMultipleValues>
            );
        }
    }
};

export default plugin;
