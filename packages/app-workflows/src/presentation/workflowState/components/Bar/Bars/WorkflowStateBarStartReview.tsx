import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";

export const WorkflowStateBarStartReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarStartReviewDecorator(props) {
        const { presenter } = props;

        const { step } = presenter.vm;
        if (!step || !presenter.vm.isPending) {
            return <Original {...props} />;
        } else if (!step.canReview) {
            return (
                <Alert swatchColor={step.color}>
                    This item is currently under <strong>{step.title}</strong> review, but you are
                    not in the team assigned to review it.
                </Alert>
            );
        }

        return (
            <Alert
                swatchColor={step.color}
                actions={<Alert.Action text={"Start Review"} onClick={presenter.start} />}
            >
                You can start the review for <strong>{step.title}</strong>.
            </Alert>
        );
    });
});
