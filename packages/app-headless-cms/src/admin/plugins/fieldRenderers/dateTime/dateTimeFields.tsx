import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import DateTimeWithoutTimezone from "./DateTimeWithoutTimezone";
import DateTimeWithTimezone from "./DateTimeWithTimezone";
import Time from "./Time";
import Input from "./Input";
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
            const { field, locale } = props;

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
                                    locale={locale}
                                />
                            );
                        }
                        if (field.settings.type === "dateTimeWithTimezone") {
                            return (
                                <DateTimeWithTimezone
                                    field={field}
                                    bind={bind.index}
                                    trailingIcon={trailingIcon}
                                    locale={locale}
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
                                    locale={locale}
                                />
                            );
                        }

                        return (
                            <Input
                                bind={{
                                    ...bind.index,
                                    label: t`Value {number}`({ number: index + 1 })
                                }}
                                field={field}
                                type={field.settings.type}
                                trailingIcon={trailingIcon}
                                locale={locale}
                            />
                        );
                    }}
                </DynamicListMultipleValues>
            );
        }
    }
};

export default plugin;
