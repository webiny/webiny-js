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

        if (!presenter.vm.canReview) {
            return <Original {...props} />;
        }

        const { title } = presenter.vm.step || {};

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
                    This item is currently under <strong>{title}</strong> review.
                </Alert>
            </>
        );
    });
});
