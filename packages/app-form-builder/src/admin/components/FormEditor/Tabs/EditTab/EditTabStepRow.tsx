import React from "react";
import { ConnectDragSource } from "react-dnd";
import { FormStepContextProvider } from "./FormStep/FormStepContext/FormStepContext";
import { FormStep } from "./FormStep/FormStep";
import { FbFormStep } from "~/types";
import { useFormEditor } from "~/admin/components/FormEditor/Context";

interface EditTabStepRowProps {
    dragRef: ConnectDragSource;
    setIsEditStep: (params: { isOpened: boolean; id: string }) => void;
    formStep: FbFormStep;
    index: number;
}

export const EditTabStepRow = ({
    dragRef,
    setIsEditStep,
    formStep,
    index
}: EditTabStepRowProps) => {
    const { getStepFields, updateField, deleteField, data, deleteStep } = useFormEditor();

    return (
        <div ref={dragRef}>
            <FormStepContextProvider>
                <FormStep
                    key={index}
                    formStep={formStep}
                    title={formStep.title}
                    onDelete={() => deleteStep(formStep.id)}
                    onEdit={() => {
                        setIsEditStep({
                            isOpened: true,
                            id: formStep.id
                        });
                    }}
                    deleteStepDisabled={data.steps.length <= 1}
                    getStepFields={getStepFields}
                    updateField={updateField}
                    deleteField={deleteField}
                />
            </FormStepContextProvider>
        </div>
    );
};
