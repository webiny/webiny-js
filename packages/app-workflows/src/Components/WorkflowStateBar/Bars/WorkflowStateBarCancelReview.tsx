/**
 * Owner of the review can cancel the review request.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarCancelReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarCancelReviewDecorator(props) {
        const { presenter } = props;

        if (!presenter.vm.canCancel) {
            return <Original {...props} />;
        }

        return (
            <Alert
                actions={
                    <>
                        <Alert.Action
                            text={"Cancel Review Request"}
                            onClick={() => presenter.cancel()}
                        />
                    </>
                }
            >
                This entry is now under {presenter.vm.step?.title}. You can cancel the review
                request.
            </Alert>
        );
    });
});
