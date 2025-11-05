/**
 * User can approve or reject the item in review.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateValue } from "~/types.js";

export const WorkflowStateBarReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarReviewDecorator(props) {
        const { presenter } = props;

        const { step } = presenter.vm;
        /**
         * If current user cannot review the step, continue.
         */
        if (!step?.canReview || step.state !== WorkflowStateValue.inReview) {
            return <Original {...props} />;
        }
        /**
         * Current user can review and is not an owner of the review step - can take over the review.
         */
        //
        else if (!step.isOwner) {
            const displayName =
                step.savedBy?.displayName || "unknown: " + step.savedBy?.id || "N/A";
            return (
                <Alert
                    actions={
                        <Alert.Action
                            text={"Take Over"}
                            onClick={presenter.showTakeOverDialog}
                            className={"ml-sm"}
                        />
                    }
                >
                    This item is currently under <strong>{step.title}</strong> review, but you are
                    not the owner of the review. Owner is {displayName}. You can take it over if you
                    want to.
                </Alert>
            );
        }
        /**
         * Current user is reviewing and can approve or reject.
         */
        return (
            <Alert
                actions={
                    <>
                        <Alert.Action text={"Approve"} onClick={presenter.showApproveDialog} />
                        <Alert.Action
                            text={"Reject"}
                            onClick={presenter.showRejectDialog}
                            className={"ml-sm"}
                        />
                    </>
                }
            >
                This item is currently under <strong>{step.title}</strong> review.
            </Alert>
        );
    });
});
