import { FbFormModelField, FbFormModel, FbFormModelFieldsLayout, FbFormStep } from "~/types";

interface Params {
    field: FbFormModelField;
    data: FbFormModel;
    targetStepId: string;
}
export default ({ field, data, targetStepId }: Params): FbFormModel => {
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
    const targetStepLayout = data.steps.find(s => s.id === targetStepId) as FbFormStep;
    let currentRowIndex = 0;

    targetStepLayout.layout.forEach(row => {
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

    targetStepLayout.layout = layout;
    return data;
};
