import { useContext } from "react";
import { EditorFieldContext } from "~/admin/components/FieldEditor/EditorFieldContext";
import { useFieldEditor } from "~/admin/components/FieldEditor";

export function useEditorField() {
    const field = useContext(EditorFieldContext);

    if (!field) {
        throw Error(
            `EditorFieldContext is missing in the component tree! Are you using the "useEditorField()" hook in the right place?`
        );
    }

    const { getFieldPlugin } = useFieldEditor();
    const fieldPlugin = getFieldPlugin(field.type);

    if (!fieldPlugin) {
        throw Error(`Field plugin is missing for field type "${field.type}"!`);
    }

    return { field, fieldPlugin };
}
