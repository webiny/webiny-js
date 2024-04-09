import React, { useRef } from "react";
import ApolloClient from "apollo-client";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";
import { config as appConfig } from "@webiny/app/config";
import { CmsContentEntry, CmsModel } from "~/types";
import { MutationHookOptions } from "@apollo/react-hooks";
import { AsyncProcessor, composeAsync } from "@webiny/utils";

interface MutationEntryOptions {
    mutationOptions?: MutationHookOptions;
}

type PublishEntryOptions = MutationEntryOptions;
type UnpublishEntryOptions = MutationEntryOptions;
type DeleteEntryOptions = MutationEntryOptions;

interface EntryError {
    message: string;
    code?: string;
    data?: Record<string, any>;
}

export interface OnEntryPublishRequest {
    model: CmsModel;
    entry: CmsContentEntry;
    id: string;
    options: PublishEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError | null;
    locale: string;
    client: ApolloClient<any>;
}

export interface OnEntryPublishResponse extends Omit<OnEntryPublishRequest, "entry"> {
    entry: CmsContentEntry | undefined;
}

export interface OnEntryDeleteRequest {
    model: CmsModel;
    entry: Pick<CmsContentEntry, "id">;
    id: string;
    options: DeleteEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError | null;
    locale: string;
    client: ApolloClient<any>;
}

export interface OnEntryDeleteResponse extends Omit<OnEntryDeleteRequest, "entry"> {
    entry: Pick<CmsContentEntry, "id"> | undefined;
}

export interface OnEntryUnpublishRequest {
    model: CmsModel;
    entry: Pick<CmsContentEntry, "id">;
    id: string;
    options: UnpublishEntryOptions;
    // TODO: Maybe a different input and output type for compose.
    error?: EntryError | null;
    locale: string;
    client: ApolloClient<any>;
}

export interface OnEntryUnpublishResponse extends Omit<OnEntryUnpublishRequest, "entry"> {
    entry: CmsContentEntry | undefined;
}

type OnEntryRevisionPublishSubscriber = AsyncProcessor<
    OnEntryPublishRequest,
    OnEntryPublishResponse
>;
type OnEntryDeleteSubscriber = AsyncProcessor<OnEntryDeleteRequest, OnEntryDeleteResponse>;
type OnEntryRevisionUnpublishSubscriber = AsyncProcessor<
    OnEntryUnpublishRequest,
    OnEntryUnpublishResponse
>;

interface PublishEntryRevisionParams {
    model: CmsModel;
    entry: CmsContentEntry;
    options?: PublishEntryOptions;
    id: string;
}
interface DeleteEntryParams {
    model: CmsModel;
    entry: Pick<CmsContentEntry, "id">;
    id: string;
    options?: DeleteEntryOptions;
}

interface UnpublishEntryRevisionParams {
    model: CmsModel;
    entry: Pick<CmsContentEntry, "id">;
    id: string;
    options?: UnpublishEntryOptions;
}

export interface CmsContext {
    getApolloClient(locale: string): ApolloClient<any>;
    createApolloClient: CmsProviderProps["createApolloClient"];
    apolloClient: ApolloClient<any>;
    publishEntryRevision: (params: PublishEntryRevisionParams) => Promise<OnEntryPublishResponse>;
    onEntryRevisionPublish: (fn: OnEntryRevisionPublishSubscriber) => () => void;
    unpublishEntryRevision: (
        params: UnpublishEntryRevisionParams
    ) => Promise<OnEntryUnpublishResponse>;
    onEntryRevisionUnpublish: (fn: OnEntryRevisionUnpublishSubscriber) => () => void;
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

export const CmsProvider = (props: CmsProviderProps) => {
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    const { getCurrentLocale } = useI18N();

    const onEntryRevisionPublish = useRef<OnEntryRevisionPublishSubscriber[]>([]);
    const onEntryRevisionUnpublish = useRef<OnEntryRevisionUnpublishSubscriber[]>([]);
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
        unpublishEntryRevision: async params => {
            return await composeAsync([...onEntryRevisionUnpublish.current].reverse())({
                locale: currentLocale,
                ...params,
                client: getApolloClient(currentLocale),
                options: params.options || {}
            });
        },
        onEntryRevisionUnpublish: fn => {
            onEntryRevisionUnpublish.current.push(fn);
            return () => {
                const index = onEntryRevisionUnpublish.current.length;
                onEntryRevisionUnpublish.current.splice(index, 1);
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
