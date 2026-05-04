import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { DelayedOnChange } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textarea: { fieldType: "text"; settings?: { rows?: number } };
    }
}

export const TextareaRenderer = createFieldRenderer<"textarea">(({ field }) => {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Textarea
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
                rows={field.rendererSettings?.rows ?? 5}
            />
        </DelayedOnChange>
    );
});
