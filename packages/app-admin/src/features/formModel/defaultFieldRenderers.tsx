import React from "react";
import { observer } from "mobx-react-lite";
import { Input } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import type { IFieldVM, IValueOption } from "./abstractions.js";
import type { FieldRenderers } from "./FormView.js";
import { DelayedOnChange } from "@webiny/admin-ui";

const TextRenderer = observer(function TextRenderer({ field }: { field: IFieldVM }) {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Input
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
            />
        </DelayedOnChange>
    );
});

const SelectRenderer = observer(function SelectRenderer({ field }: { field: IFieldVM }) {
    const options: IValueOption[] = field.options ?? [];

    return (
        <Select
            label={field.label}
            placeholder={field.placeholder}
            value={(field.value as string) ?? ""}
            onChange={value => field.onChange(value)}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            options={options.map(opt => ({
                label: opt.label,
                value: opt.value,
                disabled: opt.disabled
            }))}
        />
    );
});

export const defaultFieldRenderers: FieldRenderers = {
    text: TextRenderer,
    select: SelectRenderer
};
