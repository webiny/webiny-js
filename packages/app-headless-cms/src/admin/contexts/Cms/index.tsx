import React, { useRef } from "react";
import ApolloClient from "apollo-client";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";
import { config as appConfig } from "@webiny/app/config";
import { CmsEditorContentEntry } from "~/types";
import { MutationHookOptions } from "@apollo/react-hooks";
import { AsyncProcessor, composeAsync } from "@webiny/utils";

interface PublishEntryOptions {
    mutationOptions?: MutationHookOptions;
    client: ApolloClient<object>;
}

type DeleteEntryOptions = PublishEntryOptions;

interface EntryError {
    message: string;
    code: string;
    data: Record<string, any>;
}

interface OnEntryPublish {
    entry: CmsEditorContentEntry;
    options: PublishEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError;
}

type OnEntryDelete = OnEntryPublish;

type OnEntryPublishSubscriber = AsyncProcessor<OnEntryPublish>;
type OnEntryDeleteSubscriber = AsyncProcessor<OnEntryDelete>;

export interface CmsContext {
    getApolloClient(locale: string): ApolloClient<any>;
    createApolloClient: CmsProviderProps["createApolloClient"];
    apolloClient: ApolloClient<any>;
    publishEntry: (
        entry: CmsEditorContentEntry,
        options: PublishEntryOptions
    ) => Promise<OnEntryPublish>;
    onEntryPublish: (fn: OnEntryPublishSubscriber) => () => void;
    deleteEntry: (
        entry: CmsEditorContentEntry,
        options: DeleteEntryOptions
    ) => Promise<OnEntryDelete>;
    onEntryDelete: (fn: OnEntryDeleteSubscriber) => () => void;
}

export const CmsContext = React.createContext<CmsContext>({
    getApolloClient: () => {
        return null;
    },
    createApolloClient: () => {
        return null;
    },
    apolloClient: null
    /**
     * Safe to cast.
     */
} as unknown as CmsContext);

interface ApolloClientsCache {
    [locale: string]: ApolloClient<any>;
}

const apolloClientsCache: ApolloClientsCache = {};

export interface CmsProviderProps {
    createApolloClient: (params: { uri: string }) => ApolloClient<any>;
    children: React.ReactNode;
}

export const CmsProvider: React.FC<CmsProviderProps> = props => {
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    const { getCurrentLocale } = useI18N();

    const onEntryPublish = useRef<OnEntryPublishSubscriber[]>([]);
    const onEntryDelete = useRef<OnEntryDeleteSubscriber[]>([]);

    const currentLocale = getCurrentLocale("content");

    if (currentLocale && !apolloClientsCache[currentLocale]) {
        apolloClientsCache[currentLocale] = props.createApolloClient({
            uri: `${apiUrl}/cms/manage/${currentLocale}`
        });
    }

    if (!currentLocale) {
        return <CircularProgress />;
    }

    const value: CmsContext = {
        getApolloClient(locale: string) {
            if (!apolloClientsCache[locale]) {
                apolloClientsCache[locale] = props.createApolloClient({
                    uri: `${apiUrl}/cms/manage/${locale}`
                });
            }
            return apolloClientsCache[locale];
        },
        createApolloClient: props.createApolloClient,
        apolloClient: apolloClientsCache[currentLocale],
        publishEntry: async (entry, options) => {
            return await composeAsync([...onEntryPublish.current].reverse())({
                entry,
                options
            });
        },
        onEntryPublish: fn => {
            onEntryPublish.current.push(fn);
            return () => {
                const index = onEntryPublish.current.length;
                onEntryPublish.current.splice(index, 1);
            };
        },
        deleteEntry: async (entry, options) => {
            return await composeAsync([...onEntryDelete.current].reverse())({
                entry,
                options
            });
        },
        onEntryDelete: fn => {
            onEntryDelete.current.push(fn);
            return () => {
                const index = onEntryDelete.current.length;
                onEntryDelete.current.splice(index, 1);
            };
        }
    };

    return <CmsContext.Provider value={value} {...props} />;
};
