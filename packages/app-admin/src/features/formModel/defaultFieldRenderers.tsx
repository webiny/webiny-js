import React from "react";
import { observer } from "mobx-react-lite";
import { Input } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import type { IFieldVM, ISelectOption } from "./abstractions.js";
import type { FieldRenderers } from "./FormView.js";

const TextRenderer = observer(function TextRenderer({ field }: { field: IFieldVM }) {
    return (
        <Input
            label={field.label}
            placeholder={field.placeholder}
            value={(field.value as string) ?? ""}
            onChange={value => field.onChange(value)}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
        />
    );
});

const SelectRenderer = observer(function SelectRenderer({ field }: { field: IFieldVM }) {
    const options: ISelectOption[] = field.options ?? [];

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
