import React from "react";
import { FbBuilderFormFieldValidatorPlugin } from "~/types";
import { DateTime } from "~/admin/plugins/editor/formFields/components/DateTime";

const plugin: FbBuilderFormFieldValidatorPlugin = {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-date-gte",
    validator: {
        name: "dateGte",
        label: "Later or equal",
        description: `Entered date/time must be equal or later compared to the provided date.`,
        defaultMessage: "Date/time is earlier than the provided one.",
        renderSettings({ Bind, formFieldData }) {
            const fieldFormat = formFieldData?.settings?.format;

            return <DateTime fieldFormat={fieldFormat} Bind={Bind} />;
        }
    }
};

export default plugin;
