import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Input } from "@webiny/admin-ui";
import { DelayedOnChange } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textInput: { fieldType: "text"; settings: undefined };
    }
}

export const InputRenderer = createFieldRenderer(({ field }) => {
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
            />
        </DelayedOnChange>
    );
});
