import React, { useMemo } from "react";
import { Alert } from "@webiny/admin-ui";
import { type IWorkflowStatePresenter, WorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStateRepository } from "~/Repositories/index.js";
import { WorkflowStateGateway } from "~/Gateways/index.js";
import { useApolloClient } from "@apollo/react-hooks";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateBarPresenterProps {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateBarPresenter = observer((props: IWorkflowStateBarPresenterProps) => {
    const { presenter } = props;
    
    return (
        <Alert>
            The WorkflowStateBar component is not available.: - {presenter.vm.app}, {presenter.vm.id}
        </Alert>
    );
});
