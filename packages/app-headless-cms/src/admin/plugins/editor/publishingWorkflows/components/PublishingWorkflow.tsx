import React, { useMemo } from "react";
import { NewStep } from "./Step/NewStep.js";
import { Accordion } from "@webiny/admin-ui";
import type { IInactiveStep } from "./Step/InactiveStep.js";
import { InactiveStep } from "./Step/InactiveStep.js";
import { Step } from "./Step/Step.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowsPresenter } from "~/admin/plugins/editor/publishingWorkflows/presenters/index.js";

export interface IPublishingWorkflowProps {
    // workflow: IWorkflowModel;
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

export const PublishingWorkflow = observer((props: IPublishingWorkflowProps) => {
    const { presenter } = props;

    const workflow = presenter.vm.workflow;

    return (
        <>
            <InactiveStep step={draftStep} />
            <Accordion>
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
