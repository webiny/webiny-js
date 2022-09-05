import React, { useRef } from "react";
import ApolloClient from "apollo-client";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";
import { config as appConfig } from "@webiny/app/config";
import { CmsEditorContentEntry, CmsModel } from "~/types";
import { MutationHookOptions } from "@apollo/react-hooks";
import { AsyncProcessor, composeAsync } from "@webiny/utils";
import { ListQueryVariables } from "~/admin/views/contentEntries/ContentEntriesContext";

interface PublishEntryOptions {
    mutationOptions?: MutationHookOptions;
}

type DeleteEntryOptions = PublishEntryOptions;

interface EntryError {
    message: string;
    code?: string;
    data?: Record<string, any>;
}

export interface OnEntryPublishRequest {
    model: CmsModel;
    entry: CmsEditorContentEntry;
    id: string;
    options: PublishEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError | null;
    locale: string;
    client: ApolloClient<any>;
    listQueryVariables: ListQueryVariables;
}

export interface OnEntryPublishResponse extends Omit<OnEntryPublishRequest, "entry"> {
    entry: CmsEditorContentEntry | undefined;
}

export interface OnEntryDeleteRequest {
    model: CmsModel;
    entry: CmsEditorContentEntry;
    id: string;
    options: PublishEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError | null;
    locale: string;
    client: ApolloClient<any>;
    listQueryVariables: ListQueryVariables;
}

export interface OnEntryDeleteResponse extends Omit<OnEntryDeleteRequest, "entry"> {
    entry: CmsEditorContentEntry | undefined;
}

type OnEntryRevisionPublishSubscriber = AsyncProcessor<
    OnEntryPublishRequest,
    OnEntryPublishResponse
>;
type OnEntryDeleteSubscriber = AsyncProcessor<OnEntryDeleteRequest, OnEntryDeleteResponse>;

interface PublishEntryRevisionParams {
    model: CmsModel;
    entry: CmsEditorContentEntry;
    options?: PublishEntryOptions;
    id: string;
    listQueryVariables: ListQueryVariables;
}
interface DeleteEntryParams {
    model: CmsModel;
    entry: CmsEditorContentEntry;
    id: string;
    options?: DeleteEntryOptions;
    listQueryVariables: ListQueryVariables;
}
export interface CmsContext {
    getApolloClient(locale: string): ApolloClient<any>;
    createApolloClient: CmsProviderProps["createApolloClient"];
    apolloClient: ApolloClient<any>;
    publishEntryRevision: (params: PublishEntryRevisionParams) => Promise<OnEntryPublishResponse>;
    onEntryRevisionPublish: (fn: OnEntryRevisionPublishSubscriber) => () => void;
    deleteEntry: (params: DeleteEntryParams) => Promise<OnEntryDeleteResponse>;
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

    const onEntryRevisionPublish = useRef<OnEntryRevisionPublishSubscriber[]>([]);
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

    const getApolloClient = (locale: string) => {
        if (!apolloClientsCache[locale]) {
            apolloClientsCache[locale] = props.createApolloClient({
                uri: `${apiUrl}/cms/manage/${locale}`
            });
        }
        return apolloClientsCache[locale];
    };

    const value: CmsContext = {
        getApolloClient,
        createApolloClient: props.createApolloClient,
        apolloClient: getApolloClient(currentLocale),
        publishEntryRevision: async params => {
            return await composeAsync([...onEntryRevisionPublish.current].reverse())({
                locale: currentLocale,
                ...params,
                client: getApolloClient(currentLocale),
                options: params.options || {}
            });
        },
        onEntryRevisionPublish: fn => {
            onEntryRevisionPublish.current.push(fn);
            return () => {
                const index = onEntryRevisionPublish.current.length;
                onEntryRevisionPublish.current.splice(index, 1);
            };
        },
        deleteEntry: async params => {
            return await composeAsync([...onEntryDelete.current].reverse())({
                locale: currentLocale,
                ...params,
                client: getApolloClient(currentLocale),
                options: params.options || {}
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
