import { useState, useRef } from "react";
import { getPlugins } from "webiny-plugins";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

export default function useEditTab() {
    const [fieldDialogOpened, showFieldDialog] = useState(false);
    const {
        state: formEditorState,
        setFormState,
        insertField,
        updateField,
        editField
    } = useFormEditor();
    const createAtRef = useRef(null);

    function closeFieldDialog() {
        editField(null);
        showFieldDialog(false);
    }

    function onDrop(source, target) {
        const { pos, type, ui } = source;
        const { row } = target;

        createAtRef.current = { ...target };

        if (type === "custom") {
            showFieldDialog(true);
            return;
        }

        if (ui === "row") {
            // Reorder rows.
            // Reorder logic is different depending on the source and target position.
            setFormState(state => {
                return {
                    ...state,
                    fields:
                        pos.row < row
                            ? [
                                  ...state.fields.slice(0, pos.row),
                                  ...state.fields.slice(pos.row + 1, row),
                                  state.fields[pos.row],
                                  ...state.fields.slice(row)
                              ]
                            : [
                                  ...state.fields.slice(0, row),
                                  state.fields[pos.row],
                                  ...state.fields.slice(row, pos.row),
                                  ...state.fields.slice(pos.row + 1)
                              ]
                };
            });

            return;
        }

        // If source pos is set, we are moving an existing field.
        if (pos) {
            setFormState(state => {
                const fields = [...state.fields];
                const fieldData = { ...fields[pos.row][pos.index] };

                fields[pos.row].splice(pos.index, 1);

                if (fields[pos.row].length === 0) {
                    fields.splice(pos.row, 1);
                    if (pos.row < row) {
                        createAtRef.current.row--;
                    }
                }

                return insertField(fieldData, createAtRef.current, { ...state, fields });
            });

            return;
        }

        // Find field plugin which handles the dropped field type "id".
        const plugin = getPlugins("form-editor-field-type").find(pl => pl.fieldType.id === type);
        const data = plugin.fieldType.createField();
        insertField(data, createAtRef.current);
    }

    function saveField(fieldData) {
        if (!fieldData._id) {
            insertField(fieldData, createAtRef.current);
        } else {
            updateField(fieldData);
        }
    }

    return {
        state: formEditorState,
        fieldDialogOpened,
        closeFieldDialog,
        onDrop,
        saveField
    };
}
