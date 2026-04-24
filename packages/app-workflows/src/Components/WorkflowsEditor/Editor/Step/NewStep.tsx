import React, { useCallback, useState } from "react";
import { ReactComponent as Add } from "@webiny/icons/add.svg";
import { Step } from "./Step.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IWorkflowNotificationType, IWorkflowStep, IWorkflowStepTeam } from "~/types.js";
import { Button, Grid, Icon } from "@webiny/admin-ui";
import { NonEmptyArray } from "@webiny/app/types.js";

export interface IAddNewStepProps {
    onAdd: (step: IWorkflowStep) => void;
    notifications: IWorkflowNotificationType[];
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
    const { onAdd, notifications } = props;
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
                notifications={notifications}
            />
        );
    }

    return (
        <Grid className={"w-full"}>
            <Grid.Column
                span={12}
                className={
                    "text-center p-sm-extra border-sm border-dashed border-neutral-muted rounded-lg"
                }
            >
                <Button
                    variant={"ghost"}
                    onClick={onClick}
                    icon={<Icon label={"Add"} size={"sm"} icon={<Add />} />}
                >
                    Add new custom step
                </Button>
            </Grid.Column>
        </Grid>
    );
};
