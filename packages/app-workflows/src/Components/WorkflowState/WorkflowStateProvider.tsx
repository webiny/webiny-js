import React, { useMemo } from "react";
import { WorkflowsGateway, WorkflowStateGateway } from "~/Gateways/index.js";
import { WorkflowsRepository, WorkflowStateRepository } from "~/Repositories/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStatePresenter } from "~/Presenters/index.js";
import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";

export interface IWorkflowStateProps {
    id: string;
    app: string;
    identity: IIdentity | null;
    client: ApolloClient<object>;
    children: React.ReactElement | React.ReactElement[];
    title: string;
}

export interface IWorkflowStateContext {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateContext = React.createContext<IWorkflowStateContext | null>(null);

export const WorkflowStateProvider = (props: IWorkflowStateProps) => {
    const { id, app, identity, client, children, title } = props;
    const presenter = useMemo(() => {
        const gateway = new WorkflowStateGateway({
            client
        });
        const repository = new WorkflowStateRepository({
            gateway
        });
        const workflowsGateway = new WorkflowsGateway({
            client
        });
        const workflowsRepository = new WorkflowsRepository({
            gateway: workflowsGateway
        });
        return new WorkflowStatePresenter({
            app,
            targetRevisionId: id,
            identity,
            repository,
            workflowsRepository,
            title
        });
    }, [app, id, identity?.id, title]);

    return (
        <WorkflowStateContext.Provider value={{ presenter }}>
            {children}
        </WorkflowStateContext.Provider>
    );
};
