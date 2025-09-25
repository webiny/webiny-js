import React, { useCallback, useState } from "react";
import { ReactComponent as Add } from "@webiny/icons/add.svg";
import { StepForm } from "./StepForm.js";
import type { IWorkflowStepInput } from "../types.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IWorkflowStep } from "@webiny/app-headless-cms-common/types/index.js";

export interface IAddNewStepProps {
    onAdd: (step: IWorkflowStep) => void;
}

const createWorkflowStep = (): IWorkflowStepInput => {
    return {
        id: generateAlphaNumericId(),
        title: "New Step",
        notifications: [],
        description: "",
        color: "white",
        teams: []
    };
};

export const NewStep = (props: IAddNewStepProps) => {
    const { onAdd } = props;
    const [adding, setAdding] = useState<IWorkflowStepInput | null>(null);

    const onClick = useCallback(() => {
        setAdding(createWorkflowStep());
    }, [setAdding]);

    if (adding) {
        return <StepForm onSave={onAdd} step={adding} />;
    }

    return (
        <div onClick={onClick}>
            <Add />
            Add new custom step
        </div>
    );
};
