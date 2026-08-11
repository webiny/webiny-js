import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { Components, useWorkflowState } from "@webiny/app-workflows";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

export const PageFormWorkflowState = observer(() => {
    const { presenter } = useWorkflowState();

    // Nothing to show — no workflow assigned and no state note. `WorkflowStateBar` already renders
    // null without a workflow, so keeping the wrapper would draw an empty strip whose `border-b`
    // stacks a second full-width hairline right under the top bar's own separator.
    if (!presenter.vm.hasWorkflow && !presenter.vm.hasState) {
        return null;
    }

    return (
        <div
            className={"max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"}
            data-affects-preview={"height"}
        >
            <WorkflowStateBar />
            {presenter.vm.hasState ? (
                <Alert type="danger" className={"mt-sm"}>
                    Any changes you do on the page will not be stored!
                </Alert>
            ) : null}
        </div>
    );
});
