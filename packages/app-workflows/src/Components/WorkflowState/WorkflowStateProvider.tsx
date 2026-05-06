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
    identity: IIdentity;
    client: ApolloClient<object>;
    children: React.ReactElement | React.ReactElement[];
    title: string;
    disabled?: boolean;
}

export interface IWorkflowStateContext {
    presenter: IWorkflowStatePresenter;
}

export const WorkflowStateContext = React.createContext<IWorkflowStateContext | null>(null);

export const WorkflowStateProvider = (props: IWorkflowStateProps) => {
    const { client, children } = props;
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
            app: props.app,
            targetRevisionId: props.id,
            identity: props.identity,
            repository,
            workflowsRepository,
            title: props.title,
            disabled: props.disabled || false
        });
    }, [props.id, props.identity, props.title, props.disabled, props.app]);

    return (
        <WorkflowStateContext.Provider value={{ presenter }}>
            {children}
        </WorkflowStateContext.Provider>
    );
};
