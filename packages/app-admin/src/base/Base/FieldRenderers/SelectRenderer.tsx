import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Select } from "@webiny/admin-ui";
import type { IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        select: { fieldType: "text" | "number"; options: true; settings: undefined };
        /** @deprecated Use "select" instead. */
        dropdown: { fieldType: "text" | "number"; options: true; settings: undefined };
    }
}

const isValidValue = (value: unknown): value is string | number =>
    typeof value === "string" || typeof value === "number";

export const SelectRenderer = createFieldRenderer(({ field }) => {
    const options: IValueOption[] = field.options ?? [];

    return (
        <Select
            label={field.label}
            hint={field.help}
            placeholder={field.placeholder}
            description={field.description}
            note={field.note}
            value={isValidValue(field.value) ? String(field.value) : ""}
            onChange={value => {
                field.onChange(value);
                field.onBlur();
            }}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            options={options.map(opt => ({
                label: opt.label,
                value: isValidValue(opt.value) ? String(opt.value) : opt.value,
                disabled: opt.disabled
            }))}
        />
    );
});
