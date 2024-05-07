import { FbFormModelField, FbFormModel, FbFormModelFieldsLayout, FbFormStep } from "~/types";

interface Params {
    field: FbFormModelField;
    data: FbFormModel;
    containerType?: "step" | "conditionGroup";
    containerId: string;
}
export default ({ field, data, containerType, containerId }: Params): FbFormModel => {
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
    const destinationContainerLayout =
        containerType === "conditionGroup"
            ? (data.fields.find(f => f._id === containerId)?.settings as FbFormStep)
            : (data.steps.find(step => step.id === containerId) as FbFormStep);
    let currentRowIndex = 0;

    destinationContainerLayout.layout.forEach(row => {
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

    destinationContainerLayout.layout = layout;
    return data;
};
