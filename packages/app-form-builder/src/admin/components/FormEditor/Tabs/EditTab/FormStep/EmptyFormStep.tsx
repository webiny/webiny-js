import React, { useCallback } from "react";
import { Center } from "~/admin/components/FormEditor/DropZone";
import { useFormStep } from "./useFormStep";
import { i18n } from "@webiny/app/i18n";
import { FbFormStep } from "~/types";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";

const t = i18n.namespace("FormsApp.Editor.EditTab");

export interface EmptyFormStepProps {
    formStep: FbFormStep;
}

export const EmptyFormStep: React.FC<EmptyFormStepProps> = ({ formStep }) => {
    const { onFormStepDrop } = useFormStep();

    const onFirstFieldDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: 0,
                    index: 0
                },
                formStep
            }),
        []
    );

    return <Center onDrop={onFirstFieldDrop}>{t`Drop your first field here`}</Center>;
};
