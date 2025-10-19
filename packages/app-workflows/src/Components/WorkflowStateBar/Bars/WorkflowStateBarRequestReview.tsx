import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarRequestReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarRequestReviewDecorator(props) {
        const { presenter } = props;
        if (presenter.vm.state === null) {
            return (
                <Alert
                    actions={
                        <Alert.Action text={"Request Review"} onClick={presenter.requestReview} />
                    }
                >
                    This item is not under review. You can request review.
                </Alert>
            );
        }
        return <Original {...props} />;
    });
});
