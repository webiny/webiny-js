import React from "react";
import { observer } from "mobx-react-lite";
import { Input } from "@webiny/admin-ui";
import { DelayedOnChange } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

export const TextRenderer = observer(function TextRenderer({ field }: { field: IFieldVM }) {
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
