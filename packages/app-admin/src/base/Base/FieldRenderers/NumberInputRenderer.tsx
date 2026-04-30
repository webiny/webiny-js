import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { DelayedOnChange, Input } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        numberInput: { fieldType: "number"; settings: undefined };
    }
}

export const NumberInputRenderer = createFieldRenderer(({ field }) => {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Input
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
                type="number"
            />
        </DelayedOnChange>
    );
});
