import React from "react";
import { NewStep } from "./Step/NewStep.js";
import { Accordion } from "@webiny/admin-ui";
import type { IInactiveStep } from "./Step/InactiveStep.js";
import { InactiveStep } from "./Step/InactiveStep.js";
import { Step } from "./Step/Step.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowsPresenter } from "~/Presenters/index.js";

export interface IWorkflowProps {
    presenter: IWorkflowsPresenter;
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

export const Workflow = observer((props: IWorkflowProps) => {
    const { presenter } = props;

    const workflow = presenter.vm.workflow;
    if (!workflow) {
        return null;
    }

    return (
        <>
            <InactiveStep step={draftStep} />
            <Accordion variant={"container"}>
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
            </Accordion>
            <NewStep onAdd={presenter.addStep} />
            <InactiveStep step={publishedStep} />
        </>
    );
});
