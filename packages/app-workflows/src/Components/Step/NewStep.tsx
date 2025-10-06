import React, { useCallback, useState } from "react";
import { ReactComponent as Add } from "@webiny/icons/add.svg";
import { Step } from "./Step.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IWorkflowStep, IWorkflowStepTeam } from "~/types.js";
import { Button, Grid } from "@webiny/admin-ui";
import { NonEmptyArray } from "@webiny/app/types.js";

export interface IAddNewStepProps {
    onAdd: (step: IWorkflowStep) => void;
}

const createWorkflowStep = (): IWorkflowStep => {
    return {
        id: generateAlphaNumericId(),
        title: "",
        notifications: [],
        description: "",
        color: "#E28743",
        teams: [] as unknown as NonEmptyArray<IWorkflowStepTeam>
    };
};

export const NewStep = (props: IAddNewStepProps) => {
    const { onAdd } = props;
    const [step, setStep] = useState<IWorkflowStep | null>(null);

    const onClick = useCallback(() => {
        setStep(createWorkflowStep());
    }, [setStep]);

    const onSave = useCallback(
        (step: IWorkflowStep) => {
            onAdd(step);
            setStep(null);
        },
        [onAdd, setStep]
    );

    const onCancel = useCallback(() => {
        setStep(null);
    }, [setStep]);

    if (step) {
        return (
            <Step
                title={"New Workflow Step"}
                onCancel={onCancel}
                onSave={onSave}
                step={step}
                open={true}
            />
        );
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
