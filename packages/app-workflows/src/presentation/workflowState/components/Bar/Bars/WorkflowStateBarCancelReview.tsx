import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";

export const WorkflowStateBarCancelReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarCancelReviewDecorator(props) {
        const { presenter } = props;

        const step = presenter.vm.step;
        if (!presenter.vm.canCancel || !step) {
            return <Original {...props} />;
        }

        return (
            <Alert
                icon={null}
                swatchColor={step.color}
                actions={
                    <Alert.Action
                        text={"Cancel Review Request"}
                        onClick={presenter.showCancelReviewDialog}
                    />
                }
            >
                This entry is now under review. You can cancel the review request.
            </Alert>
        );
    });
});
