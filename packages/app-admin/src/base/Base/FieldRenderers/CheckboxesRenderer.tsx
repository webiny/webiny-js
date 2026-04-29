import React from "react";
import { observer } from "mobx-react-lite";
import { CheckboxGroup } from "@webiny/admin-ui";
import type { IFieldVM, IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        checkboxes: { fieldType: "text" | "number"; options: true; settings: undefined };
    }
}

export const CheckboxesRenderer = observer(({ field }: { field: IFieldVM }) => {
    const options: IValueOption[] = field.options ?? [];
    const value = (field.value as (string | number)[]) ?? [];

    return (
        <CheckboxGroup
            label={field.label}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            items={options.map(opt => ({
                label: opt.label,
                value: opt.value
            }))}
            value={value}
            onChange={value => {
                field.onChange(value);
                field.onBlur();
            }}
        />
    );
});
