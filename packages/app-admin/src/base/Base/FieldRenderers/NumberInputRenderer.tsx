import React from "react";
import { observer } from "mobx-react-lite";
import { DelayedOnChange, Input } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        numberInput: { fieldType: "number"; settings: undefined };
    }
}

export const NumberInputRenderer = observer(({ field }: { field: IFieldVM }) => {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Input
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
                type="number"
            />
        </DelayedOnChange>
    );
});
