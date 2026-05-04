import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Tags } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        tags: { fieldType: "text"; settings: undefined };
    }
}

export const TagsRenderer = createFieldRenderer(({ field }) => {
    const value = (field.value as string[]) ?? [];

    return (
        <Tags
            label={field.label}
            placeholder={field.placeholder || "Add values"}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            value={value}
            onChange={value => field.onChange(value)}
        />
    );
});
