import React from "react";
import { Alert } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStateBarRequestReview } from "./Bars/WorkflowStateBarRequestReview.js";
import { WorkflowStateBarError } from "./Bars/WorkflowStateBarError.js";

export interface IWorkflowStateBarPresenterProps {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateBarPresenter = observer((props: IWorkflowStateBarPresenterProps) => {
    const { presenter } = props;
    const { error, state, loading } = presenter.vm;

    if (state === undefined) {
        return <Alert>Loading state...</Alert>;
    } else if (error) {
        return <WorkflowStateBarError error={error} />;
    } else if (state == null) {
        return (
            <WorkflowStateBarRequestReview
                requestReview={presenter.requestReview}
                loading={loading}
            />
        );
    }

    return <Alert>testing</Alert>;
});
