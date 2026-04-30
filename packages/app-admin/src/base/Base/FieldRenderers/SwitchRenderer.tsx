import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Switch } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        switch: { fieldType: "boolean"; settings: undefined };
    }
}

export const SwitchRenderer = createFieldRenderer(({ field }) => {
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
