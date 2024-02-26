import React, { createContext, useMemo, useRef } from "react";
import ApolloClient from "apollo-client";
import { useApolloClient, MutationHookOptions } from "@apollo/react-hooks";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { PageBuilderContext } from "~/contexts/PageBuilder";
import { AsyncProcessor, composeAsync } from "@webiny/utils";

export const AdminPageBuilderContext = createContext<AdminPageBuilderContext | undefined>(
    undefined
);

interface Page {
    id: string;
}

interface MutationPageOptions {
    mutationOptions?: MutationHookOptions;
    client: ApolloClient<object>;
}

export type PublishPageOptions = MutationPageOptions;
export type UnpublishPageOptions = MutationPageOptions;
export type DeletePageOptions = MutationPageOptions;

export interface AdminPageBuilderContext extends PageBuilderContext {
    publishPage: (page: Page, options: PublishPageOptions) => Promise<OnPagePublish>;
    onPagePublish: (fn: OnPagePublishSubscriber) => () => void;
    unpublishPage: (page: Page, options: UnpublishPageOptions) => Promise<OnPageUnpublish>;
    onPageUnpublish: (fn: OnPageUnpublishSubscriber) => () => void;
    deletePage: (page: Page, options: DeletePageOptions) => Promise<OnPageDelete>;
    onPageDelete: (fn: OnPageDeleteSubscriber) => () => void;
    client: ApolloClient<object>;
}

type OnPagePublishSubscriber = AsyncProcessor<OnPagePublish>;
type OnPageUnpublishSubscriber = AsyncProcessor<OnPageUnpublish>;
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

type OnPageUnpublish = OnPagePublish;
type OnPageDelete = OnPagePublish;

interface AdminPageBuilderContextProviderProps {
    children: React.ReactNode;
}

export const AdminPageBuilderContextProvider = ({
    children
}: AdminPageBuilderContextProviderProps) => {
    const pageBuilder = usePageBuilder();
    const client = useApolloClient();
    const onPagePublish = useRef<OnPagePublishSubscriber[]>([]);
    const onPageUnpublish = useRef<OnPageUnpublishSubscriber[]>([]);
    const onPageDelete = useRef<OnPageDeleteSubscriber[]>([]);

    const context: AdminPageBuilderContext = useMemo(() => {
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
            async unpublishPage(page, options) {
                return await composeAsync([...onPageUnpublish.current].reverse())({
                    page,
                    options
                });
            },
            onPageUnpublish: fn => {
                onPageUnpublish.current.push(fn);
                return () => {
                    const index = onPageUnpublish.current.length;
                    onPageUnpublish.current.splice(index, 1);
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
