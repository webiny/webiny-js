import { Alert, makeDecoratable } from "@webiny/admin-ui";
import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateBarComponentProps {
    presenter: IWorkflowStatePresenter;
}

/**
 * Code should never reach this point, as all possible states should be handled by decorators.
 * This is just a fallback to help debugging.
 */
export const WorkflowStateBarComponent = makeDecoratable(
    "WorkflowStateBarComponent",
    observer((props: IWorkflowStateBarComponentProps) => {
        const { presenter } = props;
        console.log({
            state: presenter.vm.state
        });
        return (
            <Alert>
                <div>Debugging info:</div>
                {JSON.stringify({
                    id: presenter.vm.id,
                    app: presenter.vm.app,
                    state: presenter.vm.state,
                    loading: presenter.vm.loading,
                    error: presenter.vm.error
                })}
            </Alert>
        );
    })
);
