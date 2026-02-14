import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { DateOnly } from "./DateOnly.js";
import { DateTimeWithoutTimezone } from "./DateTimeWithoutTimezone.js";
import { DateTimeWithTimezone } from "./DateTimeWithTimezone.js";
import { Time } from "./Time.js";

const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-date-time",
    renderer: {
        rendererName: "date-time-input",
        name: t`Date/Time Input`,
        description: t`Renders input for various formats of date and time.`,
        canUse({ field }) {
            return (
                field.type === "datetime" &&
                !field.list &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const fieldSettingsType = field.settings ? field.settings.type : null;

            let Component = DateOnly;
            switch (fieldSettingsType) {
                case "dateTimeWithoutTimezone":
                    Component = DateTimeWithoutTimezone;
                    break;
                case "dateTimeWithTimezone":
                    Component = DateTimeWithTimezone;
                    break;
                case "time":
                    Component = Time;
                    break;
            }

            return (
                <Bind>
                    {bind => {
                        return (
                            <Bind.ValidationContainer>
                                <Component bind={bind} field={field} />
                            </Bind.ValidationContainer>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
