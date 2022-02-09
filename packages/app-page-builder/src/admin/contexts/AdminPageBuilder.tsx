import React, { useMemo, useRef } from "react";
import ApolloClient from "apollo-client";
import { useApolloClient, MutationHookOptions } from "@apollo/react-hooks";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { AsyncProcessor, composeAsync } from "./compose";
import { PageBuilderContextValue } from "~/contexts/PageBuilder";

export const AdminPageBuilderContext = React.createContext(null);

interface Page {
    id: string;
}

export interface PublishPageOptions {
    mutationOptions?: MutationHookOptions;
    client: ApolloClient<object>;
}

export interface AdminPageBuilderContextValue extends PageBuilderContextValue {
    publishPage: (page: Page, options: PublishPageOptions) => Promise<OnPagePublish>;
    onPagePublish: (fn: OnPagePublishSubscriber) => () => void;
    client: ApolloClient<object>;
}

type OnPagePublishSubscriber = AsyncProcessor<OnPagePublish>;

interface OnPagePublish {
    page: Page;
    options: PublishPageOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: {
        message: string;
        code: string;
        data: Record<string, any>;
    };
}

export const AdminPageBuilderContextProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();
    const client = useApolloClient();
    const onPagePublish = useRef<OnPagePublishSubscriber[]>([]);

    const context: AdminPageBuilderContextValue = useMemo(() => {
        return {
            ...pageBuilder,
            async publishPage(page, options) {
                return await composeAsync([...onPagePublish.current].reverse())({
                    page,
                    options
                });
            },
            onPagePublish: (fn: OnPagePublishSubscriber) => {
                onPagePublish.current.push(fn);
                return () => {
                    const index = onPagePublish.current.length;
                    onPagePublish.current.splice(index, 1);
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
