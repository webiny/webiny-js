import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import { WorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import React, { useMemo } from "react";
import { WorkflowStatesWidgetGateway } from "~/Gateways/index.js";
import { WorkflowStatesWidgetRepository } from "~/Repositories/index.js";
import type ApolloClient from "apollo-client";
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetContext {
    presenter: IWorkflowStatesWidgetPresenter;
}

export const WorkflowStatesWidgetContext = React.createContext<IWorkflowStatesWidgetContext | null>(
    null
);

interface IWorkflowStatesProviderProps {
    type: "own" | "requested";
    children: React.ReactNode;
    client: ApolloClient<object>;
    states: NonEmptyArray<WorkflowStateValue>;
}

export const WorkflowStatesProvider = (props: IWorkflowStatesProviderProps) => {
    const { children, client, type, states } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowStatesWidgetGateway({
            client
        });
        const repository = new WorkflowStatesWidgetRepository({
            gateway
        });
        return new WorkflowStatesWidgetPresenter({
            repository,
            type,
            states
        });
    }, []);

    const value: IWorkflowStatesWidgetContext = {
        presenter
    };

    return (
        <WorkflowStatesWidgetContext.Provider value={value}>
            {children}
        </WorkflowStatesWidgetContext.Provider>
    );
};
