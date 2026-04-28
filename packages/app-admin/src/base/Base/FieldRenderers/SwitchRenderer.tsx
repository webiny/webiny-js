import React from "react";
import { observer } from "mobx-react-lite";
import { Switch } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        switch: { fieldType: "boolean"; settings: undefined };
    }
}

export const SwitchRenderer = observer(({ field }: { field: IFieldVM }) => {
    return (
        <Switch
            checked={!!field.value}
            onChange={value => field.onChange(value)}
            label={field.label}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
        />
    );
});
