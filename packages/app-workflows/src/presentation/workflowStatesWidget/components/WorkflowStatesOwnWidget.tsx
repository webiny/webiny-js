import React, { useEffect } from "react";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateWidgetCard } from "./Card/WorkflowStatesWidgetCard.js";
import { WorkflowStateValue } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

export const WorkflowStatesOwnWidget = () => {
    const canUseWorkflows = useCanUseWorkflows();
    const presenter = useWorkflowStatesWidgetPresenter();

    useEffect(() => {
        presenter.init({
            type: "own",
            states: [
                WorkflowStateValue.pending,
                WorkflowStateValue.inReview,
                WorkflowStateValue.approved,
                WorkflowStateValue.rejected
            ]
        });
    }, []);

    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Content Reviews."}>
                You do not have access to Content Reviews. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <WorkflowStateWidgetCard
            title={
                <>
                    <span className={"text-accent-primary"}>Content Reviews</span> assigned by me
                </>
            }
        />
    );
};
