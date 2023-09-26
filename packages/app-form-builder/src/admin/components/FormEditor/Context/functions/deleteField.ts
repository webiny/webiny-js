import { FbFormModelField, FbFormModel, FbFormModelFieldsLayout } from "~/types";

interface Params {
    field: FbFormModelField;
    data: FbFormModel;
    stepId?: string;
}
export default ({ field, data, stepId }: Params): FbFormModel => {
    // Remove the field from fields list...
    const fieldIndex = data.fields.findIndex(item => item._id === field._id);
    data.fields.splice(fieldIndex, 1);
    for (let i = 0; i < data.fields.length; i++) {
        if (data.fields[i]._id === field._id) {
            data.fields[i] = field;
            break;
        }
    }

    // ...and rebuild the layout object.
    const layout: FbFormModelFieldsLayout = [];
    const stepLayout = data.steps.find(s => s.id === stepId);
    let currentRowIndex = 0;
    // @ts-ignore
    stepLayout.layout.forEach(row => {
        row.forEach(fieldId => {
            const field = data.fields.find(item => item._id === fieldId);
            if (!field) {
                return;
            }
            if (!Array.isArray(layout[currentRowIndex])) {
                layout[currentRowIndex] = [];
            }

            layout[currentRowIndex].push(fieldId);
        });
        layout[currentRowIndex] && layout[currentRowIndex].length && currentRowIndex++;
    });

    // @ts-ignore
    stepLayout.layout = layout;
    return data;
};
