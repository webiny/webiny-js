import { FbFormModelField, FbFormStep } from "~/types";
import { checkIfConditionsMet } from "./getNextStepIndex";

interface GetNextStepIndexProps {
    formData: Record<string, any> | undefined;
    fieldIndex: number;
    currentStep: FbFormStep;
    field: FbFormModelField | null;
}

export default ({ formData, field, fieldIndex, currentStep }: GetNextStepIndexProps) => {
    const layout: any[][] = currentStep.layout;
    if (formData !== undefined) {
        if (field?.type === "condition-group") {
            /* 
                We need "shouldBeDefaultAction" in case all rules are not met so we can trigger "defaultBehaviour" of the Condition Group,
                as we do on line #28 and line #30.
            */
            const shouldBeDefaultAction: boolean[] = [];
            field.settings.rules?.forEach(rule => {
                shouldBeDefaultAction.push(checkIfConditionsMet({ formData, rule }));
                if (checkIfConditionsMet({ formData, rule })) {
                    if (rule.action === "show") {
                        layout.splice(fieldIndex, 1, ...field.settings.layout);
                    } else {
                        layout.splice(fieldIndex, field.settings.layout.length, [field._id]);
                    }
                } else if (
                    shouldBeDefaultAction.every(val => val === false) &&
                    field.settings.defaultBehaviour === "show"
                ) {
                    layout.splice(fieldIndex, 1, ...field.settings.layout);
                } else if (
                    shouldBeDefaultAction.every(val => val === false) &&
                    field.settings.defaultBehaviour === "hide"
                ) {
                    layout.splice(fieldIndex, field.settings.layout.length, [field._id]);
                } else {
                    layout.splice(fieldIndex, field.settings.layout.length, [field._id]);
                }
            });
        }
        return layout;
    } else {
        /* 
            We need this else block for the initial rendering of the First Step,
            if it has condition groups fields, then we will trigger "defaultBehaviour" of those condition groups.
        */
        if (field?.type === "condition-group") {
            if (field?.settings.defaultBehaviour === "show") {
                layout.splice(fieldIndex, 1, ...field.settings.layout);
            } else {
                layout.splice(fieldIndex, field?.settings.layout.length, [field?._id]);
            }
            return layout;
        }
    }
    return layout;
};
