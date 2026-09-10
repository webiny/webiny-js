import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { MultiSelect } from "@webiny/admin-ui";
import type { IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        multiSelect: {
            fieldType: "text" | "number";
            options: true;
            settings?: { showSelectionCount?: boolean };
        };
    }
}

export const MultiSelectRenderer = createFieldRenderer<"multiSelect">(({ field }) => {
    const options: IValueOption[] = field.options ?? [];
    const value = (field.value as string[]) ?? [];

    return (
        <MultiSelect
            label={field.label}
            hint={field.help}
            placeholder={field.placeholder}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            showSelectionCount={field.rendererSettings?.showSelectionCount}
            options={options.map(opt => ({
                label: opt.label,
                value: String(opt.value),
                disabled: opt.disabled
            }))}
            value={value}
            onChange={values => {
                field.onChange(values);
                field.onBlur();
            }}
        />
    );
});
