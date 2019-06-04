import { useState, useEffect } from "react";
import { camelCase } from "lodash";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { memoize, flatten } from "lodash";
import { getPlugins } from "webiny-plugins";

export default function useEditFieldDialog({ field, open }) {
    const [editField, setField] = useState(field);
    const { state } = useFormEditor();

    useEffect(() => {
        // Each time `open` prop changes, update internal field state.
        setField(field);
    }, [open]);

    const createSlugify = setValue =>
        memoize(name => {
            if (editField._id) {
                return value => value;
            }

            return value => setValue(name, camelCase(value));
        });

    function uniqueId(value) {
        if (flatten(state.fields).find(f => editField._id !== f._id && f.id === value)) {
            throw new Error("Please enter a unique ID");
        }
    }

    function getFieldType() {
        const plugin = editField
            ? getPlugins("form-editor-field-type").find(pl => pl.fieldType.id === editField.type)
            : null;

        return plugin ? plugin.fieldType : null;
    }

    return { uniqueId, createSlugify, editField, setField, getFieldType };
}
