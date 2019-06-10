// @flow
import type { FieldType, FieldIdType } from "webiny-app-forms/types";

export default ({ field, data }: { field: FieldIdType | FieldType, data: Object }) => {
    // Remove the field from fields list...
    const fieldIndex = data.fields.findIndex(item => item.id === field.id);
    data.fields.splice(fieldIndex, 1);
    for (let i = 0; i < data.fields.length; i++) {
        if (data.fields[i].id === field.id) {
            data.fields[i] = field;
            break;
        }
    }

    // ...and rebuild the layout object.
    const layout = [];
    let currentRowIndex = 0;
    data.layout.forEach(row => {
        row.forEach(fieldId => {
            const field = data.fields.find(item => item.id === fieldId);
            if (!field) {
                return true;
            }
            if (!Array.isArray(layout[currentRowIndex])) {
                layout[currentRowIndex] = [];
            }

            layout[currentRowIndex].push(fieldId);
        });
        layout[currentRowIndex] && layout[currentRowIndex].length && currentRowIndex++;
    });

    data.layout = layout;
    return data;
};
