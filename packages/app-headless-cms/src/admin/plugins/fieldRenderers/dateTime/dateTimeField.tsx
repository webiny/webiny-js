import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import DateTimeWithoutTimezone from "./DateTimeWithoutTimezone";
import DateTimeWithTimezone from "./DateTimeWithTimezone";
import Time from "./Time";
import Input from "./Input";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/date-time");
import get from "lodash/get";

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-date-time",
    renderer: {
        rendererName: "date-time-input",
        name: t`Date/Time Input`,
        description: t`Renders input for various formats of date and time.`,
        canUse({ field }) {
            return (
                field.type === "datetime" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind, locale }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => {
                        if (field.settings.type === "dateTimeWithoutTimezone") {
                            return (
                                <DateTimeWithoutTimezone
                                    field={field}
                                    bind={bind}
                                    locale={locale}
                                />
                            );
                        }
                        if (field.settings.type === "dateTimeWithTimezone") {
                            return (
                                <DateTimeWithTimezone field={field} bind={bind} locale={locale} />
                            );
                        }
                        if (field.settings.type === "time") {
                            return <Time field={field} bind={bind} locale={locale} />;
                        }

                        return (
                            <Input
                                bind={bind}
                                field={field}
                                locale={locale}
                                type={field.settings.type}
                            />
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
