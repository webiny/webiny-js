import React from "react";
import { FbBuilderFormFieldValidatorPlugin } from "~/types";
import { Date } from "~/admin/plugins/editor/formFields/components/Date";

const plugin: FbBuilderFormFieldValidatorPlugin = {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-date-lte",
    validator: {
        name: "dateLte",
        label: "Earlier or equal",
        description: "Entered date/time must be equal or earlier compared to the provided date.",
        defaultMessage: "Date/time is later than the provided one.",
        renderSettings({ Bind, formFieldData }) {
            const fieldFormat = formFieldData?.settings?.format;

            return <Date fieldFormat={fieldFormat} Bind={Bind} />;
        }
    }
};

export default plugin;
