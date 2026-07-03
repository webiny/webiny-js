import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { MultiAutoComplete } from "@webiny/admin-ui";
import type { IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        multiAutoComplete: { fieldType: "text"; options: true; settings: undefined };
    }
}

export const MultiAutoCompleteRenderer = createFieldRenderer(({ field }) => {
    const options: IValueOption[] = field.options ?? [];
    const values = (field.value as string[] | null) ?? [];

    return (
        <MultiAutoComplete
            label={field.label}
            description={field.description}
            note={field.note}
            hint={field.help}
            disabled={field.disabled}
            required={field.required}
            validation={field.validation}
            uniqueValues
            options={options.map(opt => ({
                label: opt.label,
                value: String(opt.value)
            }))}
            values={values}
            onValuesChange={selected => {
                field.onChange(selected.length > 0 ? selected : null);
                field.onBlur();
            }}
        />
    );
});
