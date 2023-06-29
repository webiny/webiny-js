import React from "react";
import { FbBuilderFormFieldValidatorPlugin } from "~/types";
import { DateTime } from "~/admin/plugins/editor/formFields/components/DateTime";

const plugin: FbBuilderFormFieldValidatorPlugin = {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-date-time-lte",
    validator: {
        name: "dateTimeLte",
        label: "Earlier or equal",
        description: "Entered date/time must be equal or earlier compared to the provided date.",
        defaultMessage: "Date/time is later than the provided one.",
        renderSettings({ Bind, formFieldData }) {
            const fieldFormat = formFieldData?.settings?.format;

            return <DateTime fieldFormat={fieldFormat} Bind={Bind} />;
        }
    }
};

export default plugin;
