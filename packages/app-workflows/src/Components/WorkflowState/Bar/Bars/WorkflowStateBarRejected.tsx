/**
 * When state is approved.
 */
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStateBarComponent } from "../WorkflowStateBarComponent.js";
import { observer } from "mobx-react-lite";

export const WorkflowStateBarRejected = WorkflowStateBarComponent.createDecorator(Original => {
    return observer(function WorkflowStateBarRejectedDecorator(props) {
        const { presenter } = props;

        const step = presenter.vm.lastRejectedStep;

        if (!step) {
            return <Original {...props} />;
        }
        return (
            <Alert
                actions={
                    <>
                        <Alert.Action
                            className={"mr-sm"}
                            text={"View Comment"}
                            onClick={() => {
                                presenter.showCommentDialog(step.id);
                            }}
                        />
                        <Alert.Action text={"Remove Review Request"} onClick={presenter.cancel} />
                    </>
                }
                type="warning"
            >
                This entry was rejected.
            </Alert>
        );
    });
});
