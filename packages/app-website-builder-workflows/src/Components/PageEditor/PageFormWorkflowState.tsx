import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { Components, useWorkflowState } from "@webiny/app-workflows";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

export const PageFormWorkflowState = observer(() => {
    const { presenter } = useWorkflowState();

    return (
        <div className={"max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"} data-affects-preview={"height"}>
            <WorkflowStateBar />
            {presenter.vm.hasState ? (
                <Alert type="danger" className={"mt-sm"}>
                    Any changes you do on the page will not be stored!
                </Alert>
            ) : null}
        </div>
    );
});
