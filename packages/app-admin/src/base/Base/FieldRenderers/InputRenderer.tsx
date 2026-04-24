import React from "react";
import { observer } from "mobx-react-lite";
import { Input } from "@webiny/admin-ui";
import { DelayedOnChange } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        input: { fieldType: "text"; settings: undefined };
    }
}

export const InputRenderer = observer(({ field }: { field: IFieldVM }) => {
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
            />
        </DelayedOnChange>
    );
});
