import React, { useCallback } from "react";
import type { IWorkflowStep } from "~/types.js";
import type { IWorkflowStepInput } from "../types.js";
import { Form } from "@webiny/form";
import { Button, Grid } from "@webiny/admin-ui";
import { StepFormTitle } from "./form/StepFormTitle.js";
import { StepFormColor } from "./form/StepFormColor.js";
import { StepFormDescription } from "./form/StepFormDescription.js";
import { StepFormNotifications } from "./form/StepFormNotifications.js";
import { StepFormTeams } from "./form/StepFormTeams.js";

export interface IStepFormProps {
    step: IWorkflowStep | null;
    onSave: (input: IWorkflowStep) => void;
    onCancel: () => void;
}

export const StepForm = ({ step, onSave, onCancel }: IStepFormProps) => {
    const onSubmit = useCallback(
        (input: IWorkflowStepInput) => {
            onSave({
                ...step,
                ...input
            });
        },
        [step, onSave]
    );
    if (!step) {
        return null;
    }
    return (
        <Form<IWorkflowStep> data={step} onSubmit={onSubmit}>
            {({ submit: onFormSubmit }) => {
                return (
                    <Grid gap={"comfortable"}>
                        <Grid.Column span={12}>
                            <Button
                                text={"Cancel"}
                                variant={"ghost"}
                                size={"md"}
                                onClick={onCancel}
                            />
                            <Button text={"Save"} variant={"primary"} onClick={onFormSubmit} />
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
                        <StepFormTeams />
                        <StepFormNotifications />
                    </Grid>
                );
            }}
        </Form>
    );
};
