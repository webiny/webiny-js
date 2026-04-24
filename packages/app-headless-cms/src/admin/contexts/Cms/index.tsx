import React, { useMemo } from "react";
import type ApolloClient from "apollo-client";
import { config as appConfig } from "@webiny/app/config.js";
import { useFeature } from "@webiny/app";
import { EventPublisherFeature } from "@webiny/app/features/eventPublisher/index.js";
import { EntryAfterCreateEvent } from "~/features/contentEntry/events/EntryAfterCreateEvent.js";
import { EntryAfterUpdateEvent } from "~/features/contentEntry/events/EntryAfterUpdateEvent.js";
import { EntryAfterDeleteEvent } from "~/features/contentEntry/events/EntryAfterDeleteEvent.js";
import type {
    CmsContentEntry,
    CmsContentEntryRevision,
    CmsErrorResponse,
    CmsModel
} from "~/types.js";
import type {
    CmsEntriesListRevisionsQueryResponse,
    CmsEntriesListRevisionsQueryVariables,
    CmsEntryBulkActionMutationResponse,
    CmsEntryBulkActionMutationVariables,
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables,
    CmsEntryCreateMutationResponse,
    CmsEntryCreateMutationVariables,
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    CmsEntryGetQueryResponse,
    CmsEntryGetQueryVariables,
    CmsEntryGetSingletonQueryResponse,
    CmsEntryPublishMutationResponse,
    CmsEntryPublishMutationVariables,
    CmsEntryUnpublishMutationResponse,
    CmsEntryUnpublishMutationVariables,
    CmsEntryUpdateMutationResponse,
    CmsEntryUpdateMutationVariables,
    CmsEntryUpdateSingletonMutationResponse,
    CmsEntryUpdateSingletonMutationVariables
} from "@webiny/app-headless-cms-common";
import {
    createBulkActionMutation,
    createCreateFromMutation,
    createCreateMutation,
    createDeleteMutation,
    createPublishMutation,
    createReadQuery,
    createReadSingletonQuery,
    createRevisionsQuery,
    createUnpublishMutation,
    createUpdateMutation,
    createUpdateSingletonMutation
} from "@webiny/app-headless-cms-common";
import { getFetchPolicy } from "~/utils/getFetchPolicy.js";

export interface EntryError {
    message: string;
    code?: string;
    data?: any;
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

interface ICatchErrorOnExecuteOptions {
    message?: string;
}

const defaultErrorMessage =
    "The system wasn't able to save the current entry. Please contact your support team to help you resolve this issue.";

const catchErrorOnExecute = async <T = any,>(
    cb: () => Promise<T>,
    options?: ICatchErrorOnExecuteOptions
) => {
    try {
        return await cb();
    } catch (ex) {
        return {
            data: {
                content: {
                    data: null,
                    error: {
                        message: options?.message || defaultErrorMessage,
                        code: ex.code,
                        stack: ex.stack,
                        data: {
                            ...ex.data
                        }
                    }
                }
            }
        };
    }
};

export interface CmsContext {
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

export interface CmsProviderProps {
    createApolloClient: (params: { uri: string }) => ApolloClient<any>;
    children: React.ReactNode;
}

export const CmsProvider = (props: CmsProviderProps) => {
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    const apolloClient = useMemo(() => {
        return props.createApolloClient({ uri: `${apiUrl}/cms/manage` });
    }, []);
    const { eventPublisher } = useFeature(EventPublisherFeature);

    const value: CmsContext = {
        createApolloClient: props.createApolloClient,
        apolloClient,
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
            const response = await catchErrorOnExecute(
                () => {
                    return value.apolloClient.mutate<
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
                },
                {
                    message:
                        "The system wasn't able to create a new entry. Please contact your support team to help you resolve this issue."
                }
            );

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

            const createdEntry = data as CmsContentEntry;

            await eventPublisher
                .publish(new EntryAfterCreateEvent({ entry: createdEntry, model }))
                .catch(e => {
                    console.error("[CmsProvider] Failed to publish EntryAfterCreateEvent", e);
                });

            return {
                entry: createdEntry
            };
        },
        createEntryRevisionFrom: async ({ model, id, input, options }) => {
            const mutation = createCreateFromMutation(model);
            const response = await catchErrorOnExecute(
                async () => {
                    return value.apolloClient.mutate<
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
                },
                {
                    message:
                        "The system wasn't able to create a new revision of the entry. Please contact your support team to help you resolve this issue."
                }
            );

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
            const response = await catchErrorOnExecute(() => {
                return value.apolloClient.mutate<
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

            const updatedEntry = data as CmsContentEntry;

            await eventPublisher
                .publish(new EntryAfterUpdateEvent({ entry: updatedEntry, model }))
                .catch(e => {
                    console.error("[CmsProvider] Failed to publish EntryAfterUpdateEvent", e);
                });

            return {
                entry: updatedEntry
            };
        },
        updateSingletonEntry: async ({ model, entry, options }) => {
            const mutation = createUpdateSingletonMutation(model);
            // oxlint-disable-next-line typescript/no-unused-vars
            const { id, ...input } = entry;
            const response = await catchErrorOnExecute(() => {
                return value.apolloClient.mutate<
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
            const response = await catchErrorOnExecute(
                () => {
                    return value.apolloClient.mutate<
                        CmsEntryPublishMutationResponse,
                        CmsEntryPublishMutationVariables
                    >({
                        mutation,
                        variables: {
                            revision: id
                        }
                    });
                },
                {
                    message:
                        "The system wasn't able to publish the current entry. Please contact your support team to help you resolve this issue."
                }
            );

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

            const response = await catchErrorOnExecute(
                () => {
                    return value.apolloClient.mutate<
                        CmsEntryUnpublishMutationResponse,
                        CmsEntryUnpublishMutationVariables
                    >({
                        mutation,
                        variables: {
                            revision: id
                        }
                    });
                },
                {
                    message:
                        "The system wasn't able to unpublish the current entry. Please contact your support team to help you resolve this issue."
                }
            );

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
            const response = await catchErrorOnExecute(
                () => {
                    return value.apolloClient.mutate<
                        CmsEntryDeleteMutationResponse,
                        CmsEntryDeleteMutationVariables
                    >({
                        mutation,
                        variables: {
                            revision: id,
                            permanently: false
                        }
                    });
                },
                {
                    message:
                        "The system wasn't able to delete the current entry. Please contact your support team to help you resolve this issue."
                }
            );

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

            const entryId = id.split("#")[0];
            await eventPublisher
                .publish(new EntryAfterDeleteEvent({ model, id, entryId }))
                .catch(e => {
                    console.error("[CmsProvider] Failed to publish EntryAfterDeleteEvent", e);
                });

            return true;
        },
        bulkAction: async ({ model, action, where, search, data }) => {
            const mutation = createBulkActionMutation(model);
            const response = await catchErrorOnExecute(
                () => {
                    return value.apolloClient.mutate<
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
                },
                {
                    message:
                        "The system wasn't able to perform the bulk action. Please contact your support team to help you resolve this issue."
                }
            );

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
