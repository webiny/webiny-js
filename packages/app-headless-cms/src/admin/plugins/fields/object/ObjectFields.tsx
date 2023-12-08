import React, { useCallback } from "react";
import { set } from "dot-prop-immutable";
import { FieldEditor, useModelFieldEditor } from "~/admin/components/FieldEditor";
import { CmsModelField, CmsModel } from "~/types";

interface ObjectFieldsProps {
    field: CmsModelField;
}
export const ObjectFields = ({ field }: ObjectFieldsProps) => {
    const { getField, updateField } = useModelFieldEditor();

    const onChange = useCallback(
        ({ fields, layout }: Pick<CmsModel, "fields" | "layout">) => {
            const currentField = getField({ id: field.id });
            const updatedField = set(
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
