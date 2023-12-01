import { FbFormStep, FbFormModelField, FbFormCondition, FbFormRule } from "~/types";

interface Props {
    fields: (FbFormModelField | null)[];
    steps: FbFormStep[];
}

export const useValidateConditionGroupRule = ({ fields, steps }: Props) => {
    const getFieldById = (id: string): FbFormModelField | null => {
        return fields.find(field => field?._id === id) || null;
    };

    const conditionGroupFields = fields.find(field => field?.type === "condition-group");
    let stepIndexWithConditionGroup = 0;

    steps.forEach((step, index) => {
        if (step.layout.flat(1).includes(conditionGroupFields?._id || "") === true) {
            stepIndexWithConditionGroup = index;
        }
    });

    const step = steps[stepIndexWithConditionGroup];
    const stepsLayout =
        stepIndexWithConditionGroup === 0
            ? step.layout.flat()
            : [...step.layout, ...steps[stepIndexWithConditionGroup - 1].layout].flat();

    const allowedFileds = stepsLayout
        .map(id => {
            const field = getFieldById(id);

            return field;
        })
        .flat(1);

    const filtered = allowedFileds.filter(field => field?.type !== "condition-group");
    let isConditioGroupFieldsValid = true;

    conditionGroupFields?.settings.rules?.forEach((rule: FbFormRule) => {
        rule.conditions.forEach((condition: FbFormCondition) => {
            if (!filtered.some(field => field?.fieldId === condition.fieldName)) {
                isConditioGroupFieldsValid = false;
                return;
            }
        });
    });

    return isConditioGroupFieldsValid;
};
