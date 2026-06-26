import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { IconPicker } from "~/admin/components/IconPicker.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsIconPicker: { fieldType: "text"; settings: undefined };
    }
}

export const CmsIconPickerRenderer = createFieldRenderer<"cmsIconPicker">(({ field }) => {
    return (
        <IconPicker
            label={field.label}
            description={field.description}
            value={field.value as string | null}
            onChange={value => {
                if (value === null) {
                    field.onChange(null);
                    return;
                }

                if (typeof value === "string") {
                    field.onChange(value);
                    return;
                }

                field.onChange(value.name);
            }}
        />
    );
});
