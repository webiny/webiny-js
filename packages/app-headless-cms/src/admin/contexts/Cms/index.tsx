import React from "react";
import ApolloClient from "apollo-client";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CircularProgress } from "@webiny/ui/Progress";
import { config as appConfig } from "@webiny/app/config";
import { CmsContentEntry, CmsContentEntryRevision, CmsErrorResponse, CmsModel } from "~/types";
import {
    CmsEntryPublishMutationResponse,
    CmsEntryPublishMutationVariables,
    createReadQuery,
    createCreateMutation,
    createCreateFromMutation,
    createUpdateMutation,
    createDeleteMutation,
    createPublishMutation,
    createUnpublishMutation,
    CmsEntryCreateMutationResponse,
    CmsEntryCreateMutationVariables,
    CmsEntryUpdateMutationResponse,
    CmsEntryUpdateMutationVariables,
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    CmsEntryUnpublishMutationResponse,
    CmsEntryUnpublishMutationVariables,
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables,
    CmsEntryGetQueryResponse,
    CmsEntryGetQueryVariables,
    createReadSingletonQuery,
    CmsEntryGetSingletonQueryResponse,
    createUpdateSingletonMutation,
    CmsEntryUpdateSingletonMutationResponse,
    CmsEntryUpdateSingletonMutationVariables,
    createRevisionsQuery,
    CmsEntriesListRevisionsQueryResponse,
    CmsEntriesListRevisionsQueryVariables,
    createBulkActionMutation,
    CmsEntryBulkActionMutationResponse,
    CmsEntryBulkActionMutationVariables
} from "@webiny/app-headless-cms-common";
import { getFetchPolicy } from "~/utils/getFetchPolicy";

export interface EntryError {
    message: string;
    code?: string;
    data?: Record<string, any>;
}

export interface OperationSuccess {
    entry: CmsContentEntry;
    error?: never;
}

export interface OperationError {
    entry?: never;
    error: EntryError;
}

export interface BulkActionOperationSuccess {
    id: string;
    error?: never;
}

interface ListEntryRevisionsOperationSuccess {
    revisions: CmsContentEntryRevision[];
    error?: never;
}

export type PartialCmsContentEntryWithId = Partial<CmsContentEntry> & { id: string };
export type GetEntryResponse = OperationSuccess | OperationError;
export type ListEntryRevisionsResponse = ListEntryRevisionsOperationSuccess | OperationError;
export type CreateEntryResponse = OperationSuccess | OperationError;
export type CreateEntryRevisionFromResponse = OperationSuccess | OperationError;
export type UpdateEntryRevisionResponse = OperationSuccess | OperationError;
export type DeleteEntryResponse = boolean | OperationError;
export type PublishEntryRevisionResponse = OperationSuccess | OperationError;
export type UnpublishEntryRevisionResponse = OperationSuccess | OperationError;
export type BulkActionResponse = BulkActionOperationSuccess | OperationError;

export interface CreateEntryParams {
    model: CmsModel;
    entry: Partial<CmsContentEntry>;
    options?: {
        skipValidators?: string[];
    };
}

export interface CreateEntryRevisionFromParams {
    model: CmsModel;
    id: string;
    input?: Record<string, any>;
    options?: {
        skipValidators?: string[];
    };
}

export interface UpdateEntryRevisionParams {
    model: CmsModel;
    entry: PartialCmsContentEntryWithId;
    options?: {
        skipValidators?: string[];
    };
}

export interface UpdateSingletonEntryParams {
    model: CmsModel;
    entry: PartialCmsContentEntryWithId;
    options?: {
        skipValidators?: string[];
    };
}

export interface PublishEntryRevisionParams {
    model: CmsModel;
    id: string;
}

export interface DeleteEntryParams {
    model: CmsModel;
    id: string;
}

export interface UnpublishEntryRevisionParams {
    model: CmsModel;
    id: string;
}

export interface GetEntryParams {
    model: CmsModel;
    id: string;
}

export interface ListEntryRevisionParams {
    model: CmsModel;
    id: string;
}

export interface GetSingletonEntryParams {
    model: CmsModel;
}

export interface BulkActionParams {
    model: CmsModel;
    action: string;
    where?: Record<string, any>;
    search?: string;
    data?: Record<string, any>;
}

export interface CmsContext {
    getApolloClient(locale: string): ApolloClient<any>;

    createApolloClient: CmsProviderProps["createApolloClient"];
    apolloClient: ApolloClient<any>;
    getEntry: (params: GetEntryParams) => Promise<GetEntryResponse>;
    listEntryRevisions: (params: ListEntryRevisionParams) => Promise<ListEntryRevisionsResponse>;
    getSingletonEntry: (params: GetSingletonEntryParams) => Promise<GetEntryResponse>;
    createEntry: (params: CreateEntryParams) => Promise<CreateEntryResponse>;
    createEntryRevisionFrom: (
        params: CreateEntryRevisionFromParams
    ) => Promise<CreateEntryRevisionFromResponse>;
    updateSingletonEntry: (
        params: UpdateSingletonEntryParams
    ) => Promise<UpdateEntryRevisionResponse>;
    updateEntryRevision: (
        params: UpdateEntryRevisionParams
    ) => Promise<UpdateEntryRevisionResponse>;
    publishEntryRevision: (
        params: PublishEntryRevisionParams
    ) => Promise<PublishEntryRevisionResponse>;
    unpublishEntryRevision: (
        params: UnpublishEntryRevisionParams
    ) => Promise<UnpublishEntryRevisionResponse>;
    deleteEntry: (params: DeleteEntryParams) => Promise<DeleteEntryResponse>;
    bulkAction: (params: BulkActionParams) => Promise<BulkActionResponse>;
}

export const CmsContext = React.createContext<CmsContext | undefined>(undefined);

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
        getEntry: async ({ model, id }) => {
            const query = createReadQuery(model);
            const isRevisionId = id.includes("#");

            const response = await value.apolloClient.query<
                CmsEntryGetQueryResponse,
                CmsEntryGetQueryVariables
            >({
                query,
                variables: isRevisionId ? { revision: id } : { entryId: id },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on getEntry query.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        listEntryRevisions: async ({ model, id }) => {
            const query = createRevisionsQuery(model);

            const response = await value.apolloClient.query<
                CmsEntriesListRevisionsQueryResponse,
                CmsEntriesListRevisionsQueryVariables
            >({
                query,
                variables: { id },
                fetchPolicy: "network-only"
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on getRevisions query.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.revisions;

            if (error) {
                return { error };
            }

            return {
                revisions: data as CmsContentEntryRevision[]
            };
        },
        getSingletonEntry: async ({ model }) => {
            const query = createReadSingletonQuery(model);

            const response = await value.apolloClient.query<CmsEntryGetSingletonQueryResponse>({
                query,
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on getSingletonEntry query.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        createEntry: async ({ model, entry, options }) => {
            const mutation = createCreateMutation(model);
            const response = await value.apolloClient.mutate<
                CmsEntryCreateMutationResponse,
                CmsEntryCreateMutationVariables
            >({
                mutation,
                variables: {
                    data: entry,
                    options
                },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on Create Entry mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        createEntryRevisionFrom: async ({ model, id, input, options }) => {
            const mutation = createCreateFromMutation(model);
            const response = await value.apolloClient.mutate<
                CmsEntryCreateFromMutationResponse,
                CmsEntryCreateFromMutationVariables
            >({
                mutation,
                variables: {
                    revision: id,
                    data: input,
                    options
                },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on Create Entry mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        updateEntryRevision: async ({ model, entry, options }) => {
            const mutation = createUpdateMutation(model);
            const { id, ...input } = entry;
            const response = await value.apolloClient.mutate<
                CmsEntryUpdateMutationResponse,
                CmsEntryUpdateMutationVariables
            >({
                mutation,
                variables: {
                    revision: id,
                    data: input,
                    options
                },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on Update Entry mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        updateSingletonEntry: async ({ model, entry, options }) => {
            const mutation = createUpdateSingletonMutation(model);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...input } = entry;
            const response = await value.apolloClient.mutate<
                CmsEntryUpdateSingletonMutationResponse,
                CmsEntryUpdateSingletonMutationVariables
            >({
                mutation,
                variables: {
                    data: input,
                    options
                },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on updateSingletonEntry mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        publishEntryRevision: async ({ model, id }) => {
            const mutation = createPublishMutation(model);
            const response = await value.apolloClient.mutate<
                CmsEntryPublishMutationResponse,
                CmsEntryPublishMutationVariables
            >({
                mutation,
                variables: {
                    revision: id
                }
            });

            if (!response.data) {
                const error: CmsErrorResponse = {
                    message: "Missing response data on Publish Entry mutation.",
                    code: "MISSING_RESPONSE_DATA",
                    data: {}
                };
                return { error };
            }

            const { data, error } = response.data.content;

            if (error) {
                return { error };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        unpublishEntryRevision: async ({ model, id }) => {
            const mutation = createUnpublishMutation(model);

            const response = await value.apolloClient.mutate<
                CmsEntryUnpublishMutationResponse,
                CmsEntryUnpublishMutationVariables
            >({
                mutation,
                variables: {
                    revision: id
                }
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on Unpublish Entry mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }
            const { data, error } = response.data.content;
            if (error) {
                return {
                    error
                };
            }

            return {
                entry: data as CmsContentEntry
            };
        },
        deleteEntry: async ({ model, id }) => {
            const mutation = createDeleteMutation(model);
            const response = await value.apolloClient.mutate<
                CmsEntryDeleteMutationResponse,
                CmsEntryDeleteMutationVariables
            >({
                mutation,
                variables: {
                    revision: id,
                    permanently: false
                }
            });

            if (!response.data) {
                const error: CmsErrorResponse = {
                    message: "Missing response data on Delete Entry mutation.",
                    code: "MISSING_RESPONSE_DATA",
                    data: {}
                };
                return { error };
            }

            const { error } = response.data.content;

            if (error) {
                return { error };
            }

            return true;
        },
        bulkAction: async ({ model, action, where, search, data }) => {
            const mutation = createBulkActionMutation(model);
            const response = await value.apolloClient.mutate<
                CmsEntryBulkActionMutationResponse,
                CmsEntryBulkActionMutationVariables
            >({
                mutation,
                variables: {
                    action,
                    where,
                    search,
                    data
                }
            });

            if (!response.data) {
                return {
                    error: {
                        message: "Missing response data on Bulk Action mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }
            const { data: responseData, error } = response.data.content;

            if (error) {
                return {
                    error
                };
            }

            if (!responseData) {
                return {
                    error: {
                        message: "Missing response data on Bulk Action mutation.",
                        code: "MISSING_RESPONSE_DATA",
                        data: {}
                    }
                };
            }

            return responseData;
        }
    };

    return <CmsContext.Provider value={value} {...props} />;
};
