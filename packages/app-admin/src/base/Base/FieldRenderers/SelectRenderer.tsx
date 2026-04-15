import React from "react";
import { observer } from "mobx-react-lite";
import { Select } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";
import type { IValueOption } from "~/features/formModel/index.js";

export const SelectRenderer = observer(function SelectRenderer({ field }: { field: IFieldVM }) {
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
