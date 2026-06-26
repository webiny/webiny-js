import React, { useEffect } from "react";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateWidgetCard } from "./Card/WorkflowStatesWidgetCard.js";
import { WorkflowStateValue } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

export const WorkflowStatesRequestedWidget = () => {
    const canUseWorkflows = useCanUseWorkflows();
    const presenter = useWorkflowStatesWidgetPresenter();

    useEffect(() => {
        presenter.init({
            type: "requested",
            states: [WorkflowStateValue.pending, WorkflowStateValue.inReview]
        });
    }, []);

    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <WorkflowStateWidgetCard
            title={
                <>
                    <span className={"text-accent-primary"}>Content Reviews</span> assigned to me
                </>
            }
        />
    );
};
