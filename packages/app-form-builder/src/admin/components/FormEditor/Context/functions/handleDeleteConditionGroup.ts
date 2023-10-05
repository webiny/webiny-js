import { FbFormModelField, FbFormStep, FbFormModel } from "~/types";

import { deleteField } from "./index";

interface DeleteConditionGroupParams {
    data: FbFormModel;
    formStep: FbFormStep;
    stepFields: FbFormModelField[];
    conditionGroup: FbFormModelField;
    conditionGroupFields: FbFormModelField[];
}

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
