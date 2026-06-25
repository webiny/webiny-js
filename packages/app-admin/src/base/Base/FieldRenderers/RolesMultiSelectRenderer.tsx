import React, { useMemo } from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { RolesMultiAutocomplete } from "~/components/RolesMultiAutocomplete/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        rolesMultiSelect: { fieldType: "rolesMultiSelect"; settings: undefined };
    }
}

export const RolesMultiSelectRenderer = createFieldRenderer(({ field }) => {
    const rawValue = field.value as Array<string | { id: string }> | null;

    const values = useMemo(() => {
        if (!rawValue) {
            return [];
        }
        return rawValue.map(item => (typeof item === "string" ? item : item.id));
    }, [rawValue]);

    return (
        <RolesMultiAutocomplete
            label={field.label}
            values={values}
            onChange={ids => field.onChange(ids)}
            disabled={field.disabled}
        />
    );
});
