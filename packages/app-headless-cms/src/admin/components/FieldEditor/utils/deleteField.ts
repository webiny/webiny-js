import dot from "dot-prop-immutable";
import { CmsEditorField, CmsEditorFieldsLayout } from "~/types";

interface Data {
    fields: CmsEditorField[];
    layout: CmsEditorFieldsLayout;
}

export default ({ field, data }: { field: CmsEditorField; data: Data }) => {
    // Remove the field from fields list...
    const fieldIndex = data.fields.findIndex(item => item.id === field.id);
    data = dot.delete(data, `fields.${fieldIndex}`) as Data;

    // ...and rebuild the layout object.
    return dot.set(data, "layout", layout => {
        const newLayout = [];
        let currentRowIndex = 0;
        layout.forEach(row => {
            row.forEach(fieldId => {
                const field = data.fields.find(item => item.id === fieldId);
                if (!field) {
                    return true;
                }
                if (!Array.isArray(newLayout[currentRowIndex])) {
                    newLayout[currentRowIndex] = [];
                }

                newLayout[currentRowIndex].push(fieldId);
            });
            newLayout[currentRowIndex] && newLayout[currentRowIndex].length && currentRowIndex++;
        });

        return newLayout;
    });
};
