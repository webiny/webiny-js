import React, { useCallback, useMemo } from "react";
import type { IWorkflowInput } from "./types.js";
import type {
    IWorkflow,
    IWorkflowStep,
    IWorkflowStepTeam
} from "@webiny/app-headless-cms-common/types/index.js";
import { NewStep } from "./Step/NewStep.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import { Accordion } from "@webiny/admin-ui";
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { IInactiveStep } from "./Step/InactiveStep.js";
import { InactiveStep } from "./Step/InactiveStep.js";
import { Step } from "./Step/Step.js";

export interface IPublishingWorkflowProps {
    workflow: IWorkflow | null;
    setWorkflow: (data: IWorkflowInput) => void;
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

export const PublishingWorkflow = (props: IPublishingWorkflowProps) => {
    const { workflow, setWorkflow } = props;

    const addWorkflowStep = useCallback(
        (input: IWorkflowStep) => {
            const id = workflow?.id || generateAlphaNumericId(10);
            const name = workflow?.name || "";
            const steps: IWorkflowStep[] = Array.from(workflow?.steps || []);
            steps.push(input);
            setWorkflow({
                id,
                name,
                steps
            });
        },
        [workflow]
    );

    const steps = useMemo((): IWorkflowStep[] => {
        return (
            workflow?.steps || [
                {
                    id: "id",
                    title: "Testing",
                    teams: [] as unknown as NonEmptyArray<IWorkflowStepTeam>,
                    color: "blue",
                    description: "A description",
                    notifications: []
                }
            ]
        );
    }, [workflow?.steps]);

    const onSave = useCallback(
        (input: IWorkflowStep) => {
            if (!workflow?.steps) {
                console.error("Workflow steps not defined. Please check the data.");
                return;
            }
            const steps = Array.from(workflow.steps || []);
            const step = steps.findIndex(s => s.id === input.id);
            if (step >= 0) {
                steps[step] = input;
                setWorkflow({
                    ...workflow,
                    steps
                });
                return;
            }
            setWorkflow({
                ...workflow,
                steps: [input]
            });
        },
        [steps, setWorkflow]
    );

    const moveUp = useCallback(
        (input: Pick<IWorkflowStep, "id">) => {
            if (!workflow?.steps) {
                console.error("Workflow steps not defined. Please check the data.");
                return;
            }
            const steps = Array.from(workflow.steps || []);
            const index = steps.findIndex(s => s.id === input.id);
            if (index < 1) {
                return;
            }
            const step = steps[index];
            steps[index] = steps[index - 1];
            steps[index - 1] = step;
            setWorkflow({
                ...workflow,
                steps
            });
        },
        [steps, setWorkflow]
    );

    const moveDown = useCallback(
        (input: Pick<IWorkflowStep, "id">) => {
            if (!workflow?.steps) {
                console.error("Workflow steps not defined. Please check the data.");
                return;
            }
            const steps = Array.from(workflow.steps || []);
            const index = steps.findIndex(s => s.id === input.id);
            if (index === -1 || index === steps.length - 1) {
                return;
            }
            const step = steps[index];
            steps[index] = steps[index + 1];
            steps[index + 1] = step;
            setWorkflow({
                ...workflow,
                steps
            });
        },
        [steps, setWorkflow]
    );

    return (
        <>
            <InactiveStep step={draftStep} />
            <Accordion>
                {steps.map(step => {
                    return (
                        <Step
                            key={`step-${step.id}`}
                            step={step}
                            onSave={onSave}
                            moveUp={moveUp}
                            moveDown={moveDown}
                        />
                    );
                })}
            </Accordion>
            <NewStep onAdd={addWorkflowStep} />

            <InactiveStep step={publishedStep} />
        </>
    );
};
