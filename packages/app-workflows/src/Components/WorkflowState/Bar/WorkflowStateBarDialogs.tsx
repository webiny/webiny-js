import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowState } from "../useWorkflowState.js";
import {
    ApproveDialog,
    ApproveSuccessDialog,
    CancelReviewDialog,
    CommentDialog,
    RejectDialog,
    RejectSuccessDialog,
    RequestReviewDialog,
    StartDialog,
    StartSuccessDialog,
    TakeOverDialog,
    TakeOverSuccessDialog
} from "./Dialogs/index.js";

export const WorkflowStateBarDialogs = observer(() => {
    const { presenter } = useWorkflowState();

    switch (presenter.vm.dialog?.type) {
        case "cancelReview":
            return <CancelReviewDialog presenter={presenter} />;
        case "requestReview":
            return <RequestReviewDialog presenter={presenter} />;
        case "start":
            return <StartDialog presenter={presenter} />;
        case "start:success":
            return <StartSuccessDialog presenter={presenter} />;
        case "approve":
            return <ApproveDialog presenter={presenter} />;
        case "approve:success":
            return <ApproveSuccessDialog presenter={presenter} />;
        case "reject":
            return <RejectDialog presenter={presenter} />;
        case "reject:success":
            return <RejectSuccessDialog presenter={presenter} />;
        case "comment":
            return <CommentDialog presenter={presenter} />;
        case "takeOver":
            return <TakeOverDialog presenter={presenter} />;
        case "takeOver:success":
            return <TakeOverSuccessDialog presenter={presenter} />;
    }
    return null;
});
