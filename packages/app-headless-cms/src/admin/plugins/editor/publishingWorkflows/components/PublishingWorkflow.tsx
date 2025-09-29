import React, { useCallback, useMemo } from "react";
import type {
    IWorkflowStep,
    IWorkflowStepTeam
} from "@webiny/app-headless-cms-common/types/index.js";
import { NewStep } from "./Step/NewStep.js";
import { Accordion } from "@webiny/admin-ui";
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { IInactiveStep } from "./Step/InactiveStep.js";
import { InactiveStep } from "./Step/InactiveStep.js";
import { Step } from "./Step/Step.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/abstractions/WorkflowModel.js";

export interface IPublishingWorkflowProps {
    workflow: IWorkflowModel;
}

const draftStep: IInactiveStep = {
    id: "draft",
    color: "grey",
    title: "Draft",
    description: "This is the initial state of your content."
};
const publishedStep: IInactiveStep = {
    id: "published",
    color: "green",
    title: "Published",
    description: "The final state for any publish content."
};

export const PublishingWorkflow = observer((props: IPublishingWorkflowProps) => {
    const { workflow } = props;

    const addWorkflowStep = useCallback(
        (input: IWorkflowStep) => {
            workflow.addStep(input);
        },
        [workflow]
    );

    const steps = useMemo(() => {
        if (workflow.steps.length > 0) {
            return workflow.steps;
        }
        workflow.addStep({
            id: "id",
            title: "Testing",
            teams: [] as unknown as NonEmptyArray<IWorkflowStepTeam>,
            color: "blue",
            description: "A description",
            notifications: []
        });
        return workflow.steps;
    }, [workflow.steps]);

    const onSave = useCallback(
        (input: IWorkflowStep) => {
            const step = workflow.findStep(input.id);
            if (!step) {
                console.error("Step not found. Please check the data.");
                return;
            }
            step.updateStep(input);
        },
        [workflow]
    );

    return (
        <>
            <InactiveStep step={draftStep} />
            <Accordion>
                {steps.map(step => {
                    return <Step key={`step-${step.id}`} step={step} onSave={onSave} />;
                })}
            </Accordion>
            <NewStep onAdd={addWorkflowStep} />
            <InactiveStep step={publishedStep} />
        </>
    );
});
