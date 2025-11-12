import type { IWorkflowStateListPresenter } from "~/Presenters/index.js";
import { WorkflowStateListPresenter } from "~/Presenters/index.js";
import React, { useMemo } from "react";
import { WorkflowStateListGateway } from "~/Gateways/index.js";
import { WorkflowStateListRepository } from "~/Repositories/index.js";
import type ApolloClient from "apollo-client";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/Presenters/abstractions/WorkflowStateListPresenter.js";

export interface IWorkflowStateListContext {
    presenter: IWorkflowStateListPresenter;
}

export const WorkflowStateListContext = React.createContext<IWorkflowStateListContext | null>(null);

interface IWorkflowStateListProviderProps {
    children: React.ReactNode;
    client: ApolloClient<object>;
    where?: IWorkflowStateListPresenterListParamsWhere;
    type?: "own" | "requested" | undefined;
}

export const WorkflowStateListProvider = (props: IWorkflowStateListProviderProps) => {
    const { children, client, where, type } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowStateListGateway({
            client
        });
        const repository = new WorkflowStateListRepository({
            gateway,
            type
        });
        const presenter = new WorkflowStateListPresenter({
            repository
        });

        presenter.list({
            where
        });

        return presenter;
    }, [where, type]);

    const value: IWorkflowStateListContext = {
        presenter
    };

    return (
        <WorkflowStateListContext.Provider value={value}>
            {children}
        </WorkflowStateListContext.Provider>
    );
};
