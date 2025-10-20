import React, { useMemo } from "react";
import { WorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStateRepository } from "~/Repositories/index.js";
import { WorkflowStateGateway } from "~/Gateways/index.js";
import { useApolloClient } from "@apollo/react-hooks";
import { WorkflowStateBarPresenter } from "./WorkflowStateBarPresenter.js";

export interface IWorkflowStateBarProps {
    id: string;
    app: string;
}

export const WorkflowStateBar = (props: IWorkflowStateBarProps) => {
    const { id, app } = props;
    const client = useApolloClient();

    const presenter = useMemo(() => {
        const gateway = new WorkflowStateGateway({
            client
        });
        const repository = new WorkflowStateRepository({
            gateway
        });
        const presenter = new WorkflowStatePresenter({
            app,
            targetRevisionId: id,
            repository
        });
        presenter.init();
        return presenter;
    }, [app, id]);

    return <WorkflowStateBarPresenter presenter={presenter} />;
};
