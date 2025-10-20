import React from "react";
import { Alert } from "@webiny/admin-ui";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

export interface IWorkflowStateBarRequestReviewProps {
    loading: boolean;
    requestReview: IWorkflowStatePresenter["requestReview"];
}

export const WorkflowStateBarRequestReview = (props: IWorkflowStateBarRequestReviewProps) => {
    const { loading, requestReview } = props;
    return (
        <Alert
            actions={
                loading ? <></> : <Alert.Action text={"Request Review"} onClick={requestReview} />
            }
        >
            {loading
                ? "Requesting review..."
                : "This item is not under review. You can request review."}
        </Alert>
    );
};
