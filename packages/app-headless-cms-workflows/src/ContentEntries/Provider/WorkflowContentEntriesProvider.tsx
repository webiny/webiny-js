import React, { useMemo } from "react";
import { ContentEntriesGateway } from "../Gateway/index.js";
import { ContentEntriesRepository } from "../Repository/index.js";
import { ContentEntriesPresenter } from "../Presenter/index.js";
import type { IContentEntriesPresenter } from "../Presenter/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type ApolloClient from "apollo-client";

export interface ContentEntriesProviderContext {
    presenter: IContentEntriesPresenter;
}

export const ContentEntriesProviderContext =
    React.createContext<ContentEntriesProviderContext | null>(null);

interface IWorkflowContentEntriesProviderProps {
    children: React.ReactNode;
    model: Pick<CmsModel, "pluralApiName">;
    client: ApolloClient<object>;
}

export const WorkflowContentEntriesProvider = (props: IWorkflowContentEntriesProviderProps) => {
    const { children, client, model } = props;

    const presenter = useMemo(() => {
        const gateway = new ContentEntriesGateway({
            client,
            model
        });
        const repository = new ContentEntriesRepository({
            gateway
        });
        return new ContentEntriesPresenter({
            repository
        });
    }, [model]);

    return (
        <ContentEntriesProviderContext.Provider value={{ presenter }}>
            {children}
        </ContentEntriesProviderContext.Provider>
    );
};
