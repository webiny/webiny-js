import React from "react";
import { NewStep } from "./Step/NewStep.js";
import type { IInactiveStep } from "./Step/InactiveStep.js";
import { InactiveStep } from "./Step/InactiveStep.js";
import { Step } from "./Step/Step.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowsPresenter } from "~/Presenters/index.js";

export interface IWorkflowEditorStepsProps {
    presenter: IWorkflowsPresenter;
}

const draftStep: IInactiveStep = {
    id: "draft",
    color: "#BEC3CC",
    title: "Draft",
    description: "This is the initial state of your content."
};
const publishedStep: IInactiveStep = {
    id: "published",
    color: "#5AC74C",
    title: "Published",
    description: "The final state for any publish content."
};

export const WorkflowEditorSteps = observer((props: IWorkflowEditorStepsProps) => {
    const { presenter } = props;

    const workflow = presenter.vm.workflow;
    if (!workflow) {
        return null;
    }

    return (
        <div className={"flex gap-y-md flex-col"}>
            <InactiveStep step={draftStep} />

            {workflow.steps.map(step => {
                return (
                    <Step
                        key={`step-${step.id}`}
                        step={step}
                        onSave={presenter.updateStep}
                        onRemove={presenter.removeStep}
                        onMoveUp={presenter.moveStepUp}
                        canMoveDown={presenter.canMoveStepDown}
                        onMoveDown={presenter.moveStepDown}
                        canMoveUp={presenter.canMoveStepUp}
                    />
                );
            })}
            <NewStep onAdd={presenter.addStep} />
            <InactiveStep step={publishedStep} />
        </div>
    );
});
