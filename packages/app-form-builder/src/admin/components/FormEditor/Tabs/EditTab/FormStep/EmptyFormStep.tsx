import React, { useCallback } from "react";
import { Center } from "~/admin/components/FormEditor/DropZone";
import { i18n } from "@webiny/app/i18n";
import { FbFormStep } from "~/types";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { useFormStep } from "./useFormStep";

const t = i18n.namespace("FormsApp.Editor.EditTab");

export interface EmptyFormStepProps {
    formStep: FbFormStep;
}

export const EmptyFormStep = (props: EmptyFormStepProps) => {
    const { formStep } = props;

    const { onFormStepDrop, handleDrop } = useFormStep();

    const onFirstFieldDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            onFormStepDrop({
                item,
                formStep,
                destinationPosition: {
                    row: 0,
                    index: 0
                }
            });

            return undefined;
        },
        [handleDrop]
    );

    return <Center onDrop={onFirstFieldDrop}>{t`Drop your first field here`}</Center>;
};
