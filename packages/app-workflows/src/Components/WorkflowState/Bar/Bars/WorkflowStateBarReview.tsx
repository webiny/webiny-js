/**
 * User can approve or reject the item in review.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarReviewDecorator(props) {
        const { presenter } = props;

        const { step } = presenter.vm;
        if (!step) {
            return <Original {...props} />;
        } else if (!step.isAllowedToReview) {
            return (
                <>
                    <Alert>
                        This item is currently under <strong>{step.title}</strong> review, but you
                        are not in the team assigned to review it.
                    </Alert>
                </>
            );
        }

        return (
            <>
                <Alert
                    actions={
                        <>
                            <Alert.Action text={"Approve"} onClick={presenter.showApproveDialog} />
                            <Alert.Action
                                text={"Reject"}
                                onClick={presenter.showRejectDialog}
                                className={"wby-ml-sm"}
                            />
                        </>
                    }
                >
                    This item is currently under <strong>{step.title}</strong> review.
                </Alert>
            </>
        );
    });
});
