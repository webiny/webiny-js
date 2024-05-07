import React, { useState } from "react";
import { EditContainer } from "./Styled";
import { useFormEditor } from "~/admin/components/FormEditor";
import { FbFormStep } from "~/types";

import { EditFormStepDialog } from "./FormStep/EditFormStepDialog/EditFormStepDialog";

import { FieldErrors } from "./FieldErrors";
import { EditTabStep } from "./EditTabStep";

export const EditTab = () => {
    const { data, errors, updateStep } = useFormEditor();

    const [editStep, setIsEditStep] = useState<{
        isOpened: boolean;
        step: FbFormStep;
    }>({
        isOpened: false,
        step: {} as FbFormStep
    });

    const stepTitle = data.steps.find(step => step.id === editStep.step.id)?.title || "";

    return (
        <EditContainer>
            <FieldErrors errors={errors} />
            {data.steps.map((formStep: FbFormStep, index: number) => (
                <EditTabStep
                    key={`edit-tab-step${index}`}
                    formStep={formStep}
                    index={index}
                    setIsEditStep={setIsEditStep}
                />
            ))}
            {editStep.isOpened && (
                <EditFormStepDialog
                    editStep={editStep}
                    setEditStep={setIsEditStep}
                    updateStep={updateStep}
                    stepTitle={stepTitle}
                    formData={data}
                />
            )}
        </EditContainer>
    );
};
