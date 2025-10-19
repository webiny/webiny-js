import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateValue } from "~/types.js";

export const WorkflowStateBarStartReview = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarStartReviewDecorator(props) {
        const { presenter } = props;
        if (presenter.vm.state?.state !== WorkflowStateValue.inReview) {
            return <Original {...props} />;
        }

        return (
            <Alert
                actions={
                    <>
                        <Alert.Action text={"Approve"} onClick={() => presenter.approve()} />
                        <Alert.Action
                            text={"Reject"}
                            onClick={() => presenter.reject("")}
                            className={"wby-ml-sm"}
                        />
                    </>
                }
            >
                This item is currently under review.
            </Alert>
        );
    });
});
