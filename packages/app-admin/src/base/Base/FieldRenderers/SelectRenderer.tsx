import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Select } from "@webiny/admin-ui";
import type { IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dropdown: { fieldType: "text" | "number"; options: true; settings: undefined };
    }
}

export const SelectRenderer = createFieldRenderer(({ field }) => {
    const options: IValueOption[] = field.options ?? [];

    return (
        <Select
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            note={field.note}
            value={field.value != null ? String(field.value) : ""}
            onChange={value => {
                field.onChange(value);
                field.onBlur();
            }}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            options={options.map(opt => ({
                label: opt.label,
                value: String(opt.value),
                disabled: opt.disabled
            }))}
        />
    );
});
