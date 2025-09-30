import React, { useCallback, useState } from "react";
import { ReactComponent as Add } from "@webiny/icons/add.svg";
import { StepForm } from "./StepForm.js";
import type { IWorkflowStepInput } from "../types.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IWorkflowStep } from "@webiny/app-headless-cms-common/types/index.js";
import { Button, Grid } from "@webiny/admin-ui";

export interface IAddNewStepProps {
    onAdd: (step: IWorkflowStep) => void;
}



const createWorkflowStep = (): IWorkflowStepInput => {
    return {
        id: generateAlphaNumericId(),
        title: "",
        notifications: [],
        description: "",
        color: "#E28743",
        teams: []
    };
};

export const NewStep = (props: IAddNewStepProps) => {
    const { onAdd } = props;
    const [step, setStep] = useState<IWorkflowStepInput | null>(null);

    const onClick = useCallback(() => {
        setStep(createWorkflowStep());
    }, [setStep]);
    
    const onSave = useCallback(
        (step: IWorkflowStepInput) => {
            onAdd(step);
            setStep(null);
        },
        [onAdd, setStep]
    );
    
    const onCancel = useCallback(() => {
        setStep(null);
    }, [setStep])

    if (step) {
        return <StepForm onCancel={onCancel} onSave={onSave} step={step} />;
    }

    return (
        <Grid>
            <Grid.Column span={12} className={"wby-text-center wby-p-md"}>
                <Button
                    variant={"ghost"}
                    onClick={onClick}
                    text={
                        <>
                            <Add />
                            Add new custom step
                        </>
                    }
                />
            </Grid.Column>
        </Grid>
    );
};
