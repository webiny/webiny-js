import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";
import React, { useMemo } from "react";
import { WorkflowsGateway, WorkflowStateGateway } from "~/Gateways/index.js";
import { WorkflowsRepository, WorkflowStateRepository } from "~/Repositories/index.js";
import { type IWorkflowStatePresenter, WorkflowStatePresenter } from "~/Presenters/index.js";

export interface IWorkflowStateSetupProps {
    id: string;
    app: string;
    identity: IIdentity;
    client: ApolloClient<object>;
    children: React.ReactElement | React.ReactElement[];
}

export interface WorkflowStateSetupContext {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateSetupContext = React.createContext<WorkflowStateSetupContext | null>(
    null
);

export const WorkflowStateSetup = (props: IWorkflowStateSetupProps) => {
    const { id, app, identity, client, children } = props;
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
            workflowsRepository
        });
    }, [app, id, identity, client]);

    return (
        <WorkflowStateSetupContext.Provider value={{ presenter }}>
            {children}
        </WorkflowStateSetupContext.Provider>
    );
};
