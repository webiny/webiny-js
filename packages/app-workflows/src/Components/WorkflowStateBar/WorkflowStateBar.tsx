import React from "react";
import { observer } from "mobx-react-lite";
import { Plugins } from "@webiny/app";
import { WorkflowStateBarError } from "./Bars/WorkflowStateBarError.js";
import { WorkflowStateBarLoading } from "./Bars/WorkflowStateBarLoading.js";
import { WorkflowStateBarRequestReview } from "./Bars/WorkflowStateBarRequestReview.js";
import { WorkflowStateBarCancelReview } from "./Bars/WorkflowStateBarCancelReview.js";
import { WorkflowStateBarReview } from "./Bars/WorkflowStateBarReview.js";
import { WorkflowStateBarApproved } from "./Bars/WorkflowStateBarApproved.js";
import { WorkflowStateBarRejected } from "./Bars/WorkflowStateBarRejected.js";
import { WorkflowStateBarWorkflow } from "./Bars/WorkflowStateBarWorkflow.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";
import { ApproveDialog } from "./Bars/dialogs/ApproveDialog.js";
import { ApproveSuccessDialog } from "./Bars/dialogs/ApproveSuccessDialog.js";
import { RejectDialog } from "./Bars/dialogs/RejectDialog.js";
import { RejectSuccessDialog } from "./Bars/dialogs/RejectSuccessDialog.js";
import { CommentDialog } from "./Bars/dialogs/CommentDialog.js";
import { useWorkflowState } from "~/Components/WorkflowStateSetup/useWorkflowState.js";


export const WorkflowStateBar = observer(() => {
    const { presenter } = useWorkflowState();
    /**
     * If no workflow, do not show anything - there might not be a workflow assigned.
     * We do not want to show loading or error states in this case.
     */
    if (!presenter.vm.workflow) {
        return null;
    }
    return (
        <>
            {presenter.vm.showApproveDialog ? <ApproveDialog presenter={presenter} /> : null}
            {presenter.vm.showApproveSuccessDialog ? (
                <ApproveSuccessDialog presenter={presenter} />
            ) : null}
            {presenter.vm.showRejectDialog ? <RejectDialog presenter={presenter} /> : null}
            {presenter.vm.showRejectSuccessDialog ? (
                <RejectSuccessDialog presenter={presenter} />
            ) : null}
            {presenter.vm.showStepCommentDialog ? (
                <CommentDialog presenter={presenter} step={presenter.vm.showStepCommentDialog} />
            ) : null}
            <Plugins>
                <WorkflowStateBarApproved />
                <WorkflowStateBarRejected />
                <WorkflowStateBarReview />
                <WorkflowStateBarCancelReview />
                <WorkflowStateBarRequestReview />
                <WorkflowStateBarLoading />
                <WorkflowStateBarWorkflow />
                <WorkflowStateBarError />
            </Plugins>
            <WorkflowStateBarComponent presenter={presenter} />
        </>
    );
});
