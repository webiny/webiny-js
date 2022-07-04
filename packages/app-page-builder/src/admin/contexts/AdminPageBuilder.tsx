import React, { useMemo, useRef } from "react";
import ApolloClient from "apollo-client";
import { useApolloClient, MutationHookOptions } from "@apollo/react-hooks";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { PageBuilderContextValue } from "~/contexts/PageBuilder";
import { AsyncProcessor, composeAsync } from "@webiny/utils";

export const AdminPageBuilderContext = React.createContext<AdminPageBuilderContextValue>(
    {} as AdminPageBuilderContextValue
);

interface Page {
    id: string;
}

export interface PublishPageOptions {
    mutationOptions?: MutationHookOptions;
    client: ApolloClient<object>;
}

export type DeletePageOptions = PublishPageOptions;

export interface AdminPageBuilderContextValue extends PageBuilderContextValue {
    publishPage: (page: Page, options: PublishPageOptions) => Promise<OnPagePublish>;
    onPagePublish: (fn: OnPagePublishSubscriber) => () => void;
    deletePage: (page: Page, options: DeletePageOptions) => Promise<OnPageDelete>;
    onPageDelete: (fn: OnPageDeleteSubscriber) => () => void;
    client: ApolloClient<object>;
}

type OnPagePublishSubscriber = AsyncProcessor<OnPagePublish>;
type OnPageDeleteSubscriber = AsyncProcessor<OnPageDelete>;

interface PageError {
    message: string;
    code: string;
    data: Record<string, any>;
}

interface OnPagePublish {
    page: Page;
    options: PublishPageOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: PageError;
}

type OnPageDelete = OnPagePublish;

export const AdminPageBuilderContextProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();
    const client = useApolloClient();
    const onPagePublish = useRef<OnPagePublishSubscriber[]>([]);
    const onPageDelete = useRef<OnPageDeleteSubscriber[]>([]);

    const context: AdminPageBuilderContextValue = useMemo(() => {
        return {
            ...pageBuilder,
            async publishPage(page, options) {
                return await composeAsync([...onPagePublish.current].reverse())({
                    page,
                    options
                });
            },
            onPagePublish: fn => {
                onPagePublish.current.push(fn);
                return () => {
                    const index = onPagePublish.current.length;
                    onPagePublish.current.splice(index, 1);
                };
            },
            async deletePage(page, options) {
                return await composeAsync([...onPageDelete.current].reverse())({
                    page,
                    options
                });
            },
            onPageDelete: fn => {
                onPageDelete.current.push(fn);
                return () => {
                    const index = onPageDelete.current.length;
                    onPageDelete.current.splice(index, 1);
                };
            },
            client
        };
    }, [pageBuilder]);

    return (
        <AdminPageBuilderContext.Provider value={context}>
            {children}
        </AdminPageBuilderContext.Provider>
    );
};
