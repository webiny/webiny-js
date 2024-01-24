import React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";

import { InputField } from "./fields/Input";
import { SelectField } from "./fields/Select";
import { RadioField } from "./fields/Radio";
import { CheckboxField } from "./fields/Checkbox";
import { TextareaField } from "./fields/Textarea";
import { HiddenField } from "./fields/Hidden";
import { DateTimeField } from "./fields/DateTime";

interface FieldProps {
    field: FormRenderFbFormModelField;
}

/**
 * Renders a single form field. If needed, additional field types can be added.
 */
export const Field = (props: FieldProps) => {
    switch (props.field.type) {
        case "text":
            return <InputField {...props} />;
        case "textarea":
            return <TextareaField {...props} />;
        case "number":
            return <InputField {...props} type="number" />;
        case "select":
            return <SelectField {...props} />;
        case "radio":
            return <RadioField {...props} />;
        case "checkbox":
            return <CheckboxField {...props} />;
        case "hidden":
            return <HiddenField {...props} />;
        case "datetime":
            return <DateTimeField {...props} />;
        default:
            return <span>Cannot render field.</span>;
    }
};
