import React, { useCallback } from "react";
import { immutableSet } from "@webiny/stdlib";
import { FieldEditor, useModelFieldEditor } from "~/admin/components/FieldEditor/index.js";
import type { CmsModel, CmsModelField } from "~/types.js";

interface ObjectFieldsProps {
    field: CmsModelField;
}
export const ObjectFields = ({ field }: ObjectFieldsProps) => {
    const { getField, updateField } = useModelFieldEditor();

    const onChange = useCallback(
        ({ fields, layout }: Pick<CmsModel, "fields" | "layout">) => {
            const currentField = getField({ id: field.id });
            if (!currentField) {
                return;
            }
            const updatedField = immutableSet(
                currentField,
                `settings`,
                (settings: CmsModel["settings"]): Partial<CmsModel> => {
                    return { ...settings, fields, layout };
                }
            );
            updateField(updatedField);
        },
        [field]
    );

    return (
        <FieldEditor
            parent={field}
            fields={(field.settings ? field.settings.fields : null) || []}
            layout={(field.settings ? field.settings.layout : null) || []}
            onChange={onChange}
        />
    );
};
