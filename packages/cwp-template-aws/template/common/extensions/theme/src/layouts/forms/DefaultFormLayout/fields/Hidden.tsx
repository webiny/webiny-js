import * as React from "react";
import { FormRenderFbFormModelField } from "@webiny/app-form-builder/types";
import { useBind } from "@webiny/form";

interface InputProps {
    field: FormRenderFbFormModelField;
    type?: string;
}

export const HiddenField = ({ field }: InputProps) => {
    const { value } = useBind({
        name: field.fieldId,
        validators: field.validators
    });

    return <input type="hidden" value={value} />;
};
