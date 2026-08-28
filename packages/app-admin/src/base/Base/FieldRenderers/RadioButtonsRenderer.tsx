import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { RadioGroup } from "@webiny/admin-ui";
import type { IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        radioButtons: { fieldType: "text" | "number"; options: true; settings: undefined };
    }
}

const isValidValue = (value: unknown): value is string | number =>
    typeof value === "string" || typeof value === "number";

export const RadioButtonsRenderer = createFieldRenderer(({ field }) => {
    const options: IValueOption[] = field.options ?? [];

    return (
        <RadioGroup
            label={field.label}
            hint={field.help}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            items={options.map(opt => ({
                label: opt.label,
                value: isValidValue(opt.value) ? String(opt.value) : opt.value
            }))}
            value={isValidValue(field.value) ? String(field.value) : undefined}
            onChange={value => {
                field.onChange(value);
                field.onBlur();
            }}
        />
    );
});
