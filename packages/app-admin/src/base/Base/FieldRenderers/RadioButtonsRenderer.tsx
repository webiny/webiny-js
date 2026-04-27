import React from "react";
import { observer } from "mobx-react-lite";
import { RadioGroup } from "@webiny/admin-ui";
import type { IFieldVM, IValueOption } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        radioButtons: { fieldType: "text" | "number"; options: true; settings: undefined };
    }
}

export const RadioButtonsRenderer = observer(({ field }: { field: IFieldVM }) => {
    const options: IValueOption[] = field.options ?? [];

    return (
        <RadioGroup
            label={field.label}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            items={options.map(opt => ({
                label: opt.label,
                value: String(opt.value)
            }))}
            value={field.value !== undefined ? String(field.value) : undefined}
            onChange={value => field.onChange(value)}
        />
    );
});
