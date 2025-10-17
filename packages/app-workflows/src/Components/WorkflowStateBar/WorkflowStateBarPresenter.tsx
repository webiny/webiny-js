import React from "react";
import { Alert } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateError } from "~/Gateways/index.js";

export interface IWorkflowStateBarPresenterProps {
    presenter: IWorkflowStatePresenter;
}

interface IErrorProps {
    id: string;
    app: string;
    error: IWorkflowStateError;
}

const Error = ({ id, app, error }: IErrorProps) => {
    console.log({
        error,
        app,
        id
    });
    return (
        <Alert type="danger">
            {error.message}
            <br />
            <br />
            For more information, please check the browser console.
        </Alert>
    );
};

export const WorkflowStateBarPresenter = observer((props: IWorkflowStateBarPresenterProps) => {
    const { presenter } = props;
    const { id, app, error, state, loading } = presenter.vm;

    if (error) {
        return <Error id={id} app={app} error={error} />;
    } else if (!state) {
        return (
            <Alert
                actions={<Alert.Action text={"Request Review"} onClick={presenter.requestReview} />}
            >
                {loading
                    ? "Requesting review..."
                    : "This item is not under review. You can request review."}
            </Alert>
        );
    }

    return <Alert>testing</Alert>;
});
