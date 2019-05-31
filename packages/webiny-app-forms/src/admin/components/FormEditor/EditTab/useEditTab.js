import { useContext, useState, useRef } from "react";
import shortid from "shortid";
import { set } from "dot-prop-immutable";
import { getPlugins } from "webiny-plugins";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor";

export default function useEditTab() {
    const [fieldDialogOpened, showFieldDialog] = useState(false);
    const { state, setFormState, findFieldPosition } = useFormEditor();
    const createAt = useRef(null);

    function closeFieldDialog() {
        setFormState({ editField: null });
        showFieldDialog(false);
    }

    function saveField(data) {
        if (!data._id) {
            setFormState(insertField(data, createAt.current));
        } else {
            setFormState(updateField(data));
        }
    }

    function insertField(fieldData, position, state = state) {
        const { row, index } = position;

        if (!fieldData._id) {
            fieldData._id = shortid.generate();
        }

        if (!state.fields[row]) {
            return set(state, `fields.${row}`, [fieldData]);
        }

        const { fields } = state;

        if (index === null) {
            // Create a new row with the new field at the given row index
            return set(state, "fields", [
                ...fields.slice(0, row),
                [fieldData],
                ...fields.slice(row)
            ]);
        }

        // We are dropping a new field at the specified index
        return set(
            state,
            ["fields", row],
            [...fields[row].slice(0, index), fieldData, ...fields[row].slice(index)]
        );
    }

    function updateField(fieldData) {
        const { row, index } = findFieldPosition(fieldData._id);
        setFormState(set(state, ["fields", row, index], fieldData));
    }

    function onDrop(source, target) {
        const { pos, type, ui } = source;
        const { row } = target;

        createAt.current = { ...target };

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
                        createAt.current.row--;
                    }
                }

                return insertField(fieldData, createAt.current, { ...state, fields });
            });

            return;
        }

        // Find field plugin which handles the dropped field type "id".
        const plugin = getPlugins("cms-form-field-type").find(pl => pl.fieldType.id === type);
        const data = plugin.fieldType.createField();
        setFormState(insertField(data, createAt.current));
    }

    return {
        state: state,
        fieldDialogOpened,
        closeFieldDialog,
        saveField,
        onDrop
    };
}
