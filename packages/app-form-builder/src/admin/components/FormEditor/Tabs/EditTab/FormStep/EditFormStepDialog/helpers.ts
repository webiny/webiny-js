import findIndex from "lodash/findIndex";

import { FbFormStep, FbFormModel, FbFormModelField } from "~/types";

interface Props {
    step: FbFormStep;
    formData: FbFormModel;
}

export const getAvailableFields = ({ step, formData }: Props) => {
    const getFieldById = (id: string): FbFormModelField | null => {
        return formData.fields.find(field => field._id === id) || null;
    };

    // Checking if the step for which we adding rules is first in array of steps,
    // if yes than we will only display it's own fields in condition field select,
    // if not, than we will also display fields from previous step. (line #23)
    const indexOfTheCurrentStep = findIndex(formData.steps, { id: step.id });
    if (step.layout) {
        const layout =
            indexOfTheCurrentStep === 0
                ? step.layout
                : [...step.layout, ...formData.steps[indexOfTheCurrentStep - 1].layout];

        return layout
            .map(row => {
                return row.map(id => {
                    const field = getFieldById(id);

                    return field;
                });
            })
            .flat(1);
    }
    return [];
};
