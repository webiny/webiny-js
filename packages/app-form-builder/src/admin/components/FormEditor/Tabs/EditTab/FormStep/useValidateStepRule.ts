import { FbFormStep, FbFormModelField, FbFormStepRule } from "~/types";

interface Props {
    fields: (FbFormModelField | null)[];
    rule: FbFormStepRule;
    stepIndex: number;
    steps: FbFormStep[];
}

export const useValidateStepRule = ({ fields, rule, stepIndex, steps }: Props) => {
    const getFieldById = (id: string): FbFormModelField | null => {
        return fields.find(field => field?._id === id) || null;
    };

    const step = steps[stepIndex];
    const stepsLayout =
        stepIndex === 0
            ? step.layout.flat()
            : [...step.layout, ...steps[stepIndex - 1].layout].flat();

    const allowedFileds = stepsLayout
        .map(id => {
            const field = getFieldById(id);

            return field;
        })
        .flat(1);

    let isValidFields = true;

    rule.conditions.forEach(condition => {
        if (!allowedFileds.some(field => field?.fieldId === condition.fieldName)) {
            isValidFields = false;
            return;
        }
    });

    return isValidFields;
};
