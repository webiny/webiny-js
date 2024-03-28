import { FbFormModelField, FbFormStep, FbFormModel } from "~/types";

import { deleteField } from "./index";

interface DeleteConditionGroupParams {
    data: FbFormModel;
    formStep: FbFormStep;
    stepFields: FbFormModelField[];
    conditionGroup: FbFormModelField;
    conditionGroupFields: FbFormModelField[];
}
// When we delete condition group we also need to delete fields inside of it,
// because those fields belong directly (they are being stored in the setting of the condition group) to the condition group and not the step.
export default (params: DeleteConditionGroupParams) => {
    const { data, formStep, stepFields, conditionGroup, conditionGroupFields } = params;

    const deleteConditionGroup = () => {
        const layout = stepFields.map(field => {
            if (field._id === conditionGroup._id) {
                deleteField({
                    field,
                    data,
                    containerType: "step",
                    containerId: formStep.id
                });
                return;
            } else {
                return field;
            }
        });

        return layout;
    };

    const deleteConditionGroupFields = () => {
        const layout = conditionGroupFields.map(field => {
            if (!conditionGroup._id) {
                return;
            }
            deleteField({
                field,
                data,
                containerType: "conditionGroup",
                containerId: conditionGroup._id
            });
        });

        return layout;
    };
    deleteConditionGroupFields();

    deleteConditionGroup();
};
