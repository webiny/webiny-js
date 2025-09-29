import React, { useCallback, useMemo } from "react";
import type { IWorkflowStep } from "~/types.js";
import type { IWorkflowStepInput } from "../types.js";
import { Form } from "@webiny/form";
import { Button, Grid } from "@webiny/admin-ui";
import { StepFormTitle } from "./form/StepFormTitle.js";
import { StepFormColor } from "./form/StepFormColor.js";
import { StepFormDescription } from "./form/StepFormDescription.js";

export interface IStepFormProps {
    step: IWorkflowStepInput;
    onSave: (input: IWorkflowStep) => void;
}

export const StepForm = ({ step, onSave }: IStepFormProps) => {
    /**
     * We need to convert IWorkflowStep
     */
    const data = useMemo((): IWorkflowStep => {
        return {
            id: step.id,
            title: step.title,
            description: step.description,
            color: step.color,
            teams: step.teams,
            notifications: step.notifications
        };
    }, [step]);

    const onSubmit = useCallback(
        (input: IWorkflowStepInput) => {
            console.log({
                input
            });

            console.log({
                step
            });
            // onSave({
            //     ...step,
            //     ...input
            // });
        },
        [step, onSave]
    );
    return (
        <Form<IWorkflowStep> data={data} onSubmit={onSubmit}>
            {({ submit }) => {
                return (
                    <Grid gap={"comfortable"}>
                        <Grid.Column span={12}>
                            <Button text={"Cancel"} variant={"ghost"} size={"md"} />
                            <Button text={"Save"} variant={"primary"} onClick={submit} />
                        </Grid.Column>
                        <Grid.Column span={10}>
                            <StepFormTitle />
                        </Grid.Column>
                        <Grid.Column span={2}>
                            <StepFormColor />
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <StepFormDescription />
                        </Grid.Column>
                        {/*<StepFormTeams />*/}
                        {/*<StepFormNotifications />*/}
                    </Grid>
                );
            }}
        </Form>
    );
};
