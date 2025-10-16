import React from "react";
import { Alert } from "@webiny/admin-ui";
import { type IWorkflowStatePresenter } from "~/Presenters/index.js";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateBarPresenterProps {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateBarPresenter = observer((props: IWorkflowStateBarPresenterProps) => {
    const { presenter } = props;

    if (presenter.vm.error) {
        console.log({
            error: presenter.vm.error,
            app: presenter.vm.app,
            id: presenter.vm.id
        });
        return (
            <Alert type="danger">
                {presenter.vm.error.message}
                <br />
                <br />
                For more information, please check the browser console.
            </Alert>
        );
    }

    return <Alert>testing</Alert>;
});
