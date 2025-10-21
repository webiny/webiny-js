/**
 * Can start the review - only the owner will be locked out of starting the review.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarStartReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarStartReviewDecorator(props) {
        const { presenter } = props;

        if (!presenter.vm.canStartStepReview) {
            return <Original {...props} />;
        }

        const { color, title } = presenter.vm.step!;
        return (
            <Alert
                color={color}
                actions={
                    <>
                        <Alert.Action
                            text={"Start Step Review"}
                            onClick={() => presenter.start()}
                        />
                    </>
                }
            >
                You can start the <strong>{title}</strong> review.
            </Alert>
        );
    });
});
