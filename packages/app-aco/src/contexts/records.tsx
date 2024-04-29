import React, { ReactNode, useMemo } from "react";
import sortBy from "lodash/sortBy";
import unionBy from "lodash/unionBy";
import lodashMerge from "lodash/merge";
import { apolloFetchingHandler, loadingHandler } from "~/handlers";
import {
    createCreateRecord,
    createDeleteRecord,
    createGetRecord,
    createListRecords,
    createListTags,
    createMoveRecord,
    createUpdateRecord
} from "~/graphql/records.gql";
import {
    AcoAppMode,
    CreateSearchRecordResponse,
    CreateSearchRecordVariables,
    DeletableSearchRecordItem,
    DeleteSearchRecordResponse,
    DeleteSearchRecordVariables,
    GetSearchRecordQueryVariables,
    GetSearchRecordResponse,
    ListMeta,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsResponse,
    ListTagsQueryVariables,
    ListTagsResponse,
    ListTagsWhereQueryVariables,
    Loading,
    LoadingActions,
    MovableSearchRecordItem,
    MoveSearchRecordResponse,
    MoveSearchRecordVariables,
    SearchRecordItem,
    TagItem,
    UpdateSearchRecordResponse,
    UpdateSearchRecordVariables
} from "~/types";
import { validateOrGetDefaultDbSort } from "~/sorting";
import { useAcoApp } from "~/hooks";
import { parseIdentifier } from "@webiny/utils";
import { useStateIfMounted } from "@webiny/app-admin";

interface ListTagsParams {
    where?: ListTagsWhereQueryVariables;
}

export type ListRecordsParams = ListSearchRecordsQueryVariables;

interface SearchRecordsContext {
    records: SearchRecordItem[];
    tags: TagItem[];
    loading: Loading<LoadingActions>;
    meta: ListMeta;
    listRecords: (params: ListRecordsParams) => Promise<SearchRecordItem[]>;
    getRecord: (id: string) => Promise<SearchRecordItem | null>;
    createRecord: (record: Omit<SearchRecordItem, "id">) => Promise<SearchRecordItem>;
    updateRecord: (record: SearchRecordItem, contextFolderId?: string) => Promise<SearchRecordItem>;
    moveRecord: (record: MovableSearchRecordItem) => Promise<void>;
    deleteRecord(record: DeletableSearchRecordItem): Promise<true>;
    listTags: (params: ListTagsParams) => Promise<TagItem[]>;
    addRecordToCache: (record: any) => void;
    updateRecordInCache: (record: any) => void;
    removeRecordFromCache: (id: string) => void;
}

export const SearchRecordsContext = React.createContext<SearchRecordsContext | undefined>(
    undefined
);

interface Props {
    children: ReactNode;
}

const defaultLoading: Record<LoadingActions, boolean> = {
    INIT: true,
    LIST: false,
    LIST_MORE: false,
    GET: false,
    MOVE: false,
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

const mergeAndSortTags = (oldTagItems: TagItem[], newTags: string[]): TagItem[] => {
    if (!newTags.length) {
        return oldTagItems;
    }

    const newTagItems = newTags.map((tag: string) => ({ tag })); // create TagItem[] from array of strings
    const mergedTagItems = unionBy(oldTagItems, newTagItems, "tag"); // merge the two arrays

    return sortBy(mergedTagItems, ["tag"]);
};

const getResponseData = (response: any, mode: AcoAppMode): any => {
    if (mode === "cms") {
        return response?.content || {};
    }
    return response.search?.content || {};
};

const defaultMeta: ListMeta = {
    totalCount: 0,
    hasMoreItems: false,
    cursor: null
};

export const SearchRecordsProvider = ({ children }: Props) => {
    const { app, client, mode } = useAcoApp();
    const { model } = app;

    const [records, setRecords] = useStateIfMounted<SearchRecordItem[]>([]);
    const [tags, setTags] = useStateIfMounted<TagItem[]>([]);
    const [loading, setLoading] = useStateIfMounted<Loading<LoadingActions>>(defaultLoading);
    const [meta, setMeta] = useStateIfMounted<ListMeta>(Object.create(defaultMeta));

    const {
        GET_RECORD,
        LIST_RECORDS,
        UPDATE_RECORD,
        MOVE_RECORD,
        DELETE_RECORD,
        CREATE_RECORD,
        LIST_TAGS
    } = useMemo(() => {
        return {
            LIST_RECORDS: createListRecords(model, mode),
            UPDATE_RECORD: createUpdateRecord(model, mode),
            MOVE_RECORD: createMoveRecord(model, mode),
            GET_RECORD: createGetRecord(model, mode),
            LIST_TAGS: createListTags(model, mode),
            DELETE_RECORD: createDeleteRecord(model, mode),
            CREATE_RECORD: createCreateRecord(model, mode)
        };
    }, [app.id, model.modelId]);

    const context = useMemo<SearchRecordsContext>(() => {
        return {
            records,
            tags,
            loading,
            meta,
            addRecordToCache: (record: any) => {
                setRecords(prev => {
                    return [record, ...prev];
                });
            },
            updateRecordInCache: (record: any) => {
                const { id: recordId } = parseIdentifier(record.id);

                setRecords(prev => {
                    const index = prev.findIndex(item => {
                        const { id: itemId } = parseIdentifier(item.id);
                        return itemId === recordId;
                    });

                    if (index >= 0) {
                        const next = [...prev];
                        next[index] = lodashMerge({}, prev[index], record);
                        return next;
                    }
                    return [record, ...prev];
                });
            },
            removeRecordFromCache: (id: string) => {
                setRecords(prev => {
                    return prev.filter(record => record.id !== id);
                });
            },

            async listRecords(params) {
                const { after, limit, sort: sorting, search, where } = params;

                /**
                 * Avoiding fetching records in case they have already been fetched.
                 * This happens when visiting a list with all records loaded and receives "after" param.
                 */
                const totalCount = meta?.totalCount || 0;
                if (after && records.length === totalCount) {
                    return records;
                }

                const action = after ? "LIST_MORE" : "LIST";
                const sort = validateOrGetDefaultDbSort(sorting);

                const { data: response } = await apolloFetchingHandler<ListSearchRecordsResponse>(
                    loadingHandler(action, setLoading),
                    () => {
                        const variables: ListSearchRecordsQueryVariables = {
                            where,
                            search,
                            limit,
                            after,
                            sort
                        };
                        return client.query<
                            ListSearchRecordsResponse,
                            ListSearchRecordsQueryVariables
                        >({
                            query: LIST_RECORDS,
                            variables,
                            fetchPolicy: "network-only"
                        });
                    }
                );

                if (!response) {
                    throw new Error("Could not fetch records - no response.");
                }

                const { data, meta: responseMeta, error } = getResponseData(response, mode);

                if (!data || !responseMeta) {
                    throw new Error(error?.message || "Could not fetch records.");
                }

                setRecords(prev => {
                    // If there's no cursor, it means we're receiving a new list of records from scratch.
                    if (!after) {
                        return data;
                    }

                    return [...prev, ...data];
                });

                setMeta(() => responseMeta);

                setLoading(prev => {
                    return {
                        ...prev,
                        INIT: false
                    };
                });

                return data;
            },
            async getRecord(id) {
                if (!id) {
                    throw new Error("Record `id` is mandatory");
                }

                const { id: recordId } = parseIdentifier(id);

                const { data: response } = await apolloFetchingHandler<GetSearchRecordResponse>(
                    loadingHandler("GET", setLoading),
                    () =>
                        client.query<GetSearchRecordResponse, GetSearchRecordQueryVariables>({
                            query: GET_RECORD,
                            variables: { entryId: recordId },
                            fetchPolicy: "network-only"
                        })
                );

                if (!response) {
                    throw new Error(`Could not fetch record "${recordId}" - no response.`);
                }

                const { data, error } = getResponseData(response, mode);

                if (error && error.code !== "NOT_FOUND") {
                    throw new Error("Network error while syncing record");
                }

                if (!data) {
                    // No record found - must be deleted by previous operation
                    setRecords(prev => {
                        return prev.filter(record => record.id !== recordId);
                    });
                    return data;
                }
                setRecords(prev => {
                    const index = prev.findIndex(record => record.id === recordId);

                    // No record found in the list - must be added by previous operation
                    if (index === -1) {
                        return [data, ...prev];
                    }
                    const next = [...prev];
                    next[index] = data;
                    return next;
                });

                setTags(tags => {
                    if (!data.tags || data.tags.length === 0) {
                        return tags;
                    }

                    return mergeAndSortTags(tags, data.tags);
                });

                return data;
            },
            async createRecord(record) {
                if (!CREATE_RECORD) {
                    throw new Error("Missing CREATE_RECORD operation.");
                }

                const { data: response } = await apolloFetchingHandler<CreateSearchRecordResponse>(
                    loadingHandler("CREATE", setLoading),
                    () =>
                        client.mutate<CreateSearchRecordResponse, CreateSearchRecordVariables>({
                            mutation: CREATE_RECORD,
                            variables: {
                                data: record
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while creating search record.");
                }

                const { data, error } = getResponseData(response, mode);

                if (!data) {
                    throw new Error(error?.message || "Could not create record");
                }

                setRecords(prev => {
                    return [...prev, data];
                });

                setMeta(meta => ({
                    ...meta,
                    totalCount: ++meta.totalCount
                }));

                setTags(tags => {
                    if (!data.tags || data.tags.length === 0) {
                        return tags;
                    }

                    return mergeAndSortTags(tags, data.tags);
                });

                return data;
            },
            async updateRecord(record, contextFolderId) {
                if (!contextFolderId) {
                    throw new Error("`folderId` is mandatory");
                }
                if (!UPDATE_RECORD) {
                    throw new Error("Missing UPDATE_RECORD operation.");
                }

                const { id, location, data, title, content } = record;

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("UPDATE", setLoading),
                    () =>
                        client.mutate<UpdateSearchRecordResponse, UpdateSearchRecordVariables>({
                            mutation: UPDATE_RECORD,
                            variables: { id, data: { title, content, location, data } }
                        })
                );

                if (!response) {
                    throw new Error("Network error while updating record");
                }

                const { data: result, error } = getResponseData(response, mode);

                if (!result) {
                    throw new Error(error?.message || "Could not update record");
                }

                setRecords(records => {
                    const index = records.findIndex(record => record.id === id);
                    if (index === -1) {
                        return [result, ...records];
                    }

                    const next = [...records];

                    next[index] = result;

                    return next;
                });

                setTags(tags => {
                    if (!data.tags || data.tags.length === 0) {
                        return tags;
                    }

                    return mergeAndSortTags(tags, data.tags);
                });

                return result;
            },
            moveRecord: async (record: MovableSearchRecordItem) => {
                const { id, location } = record;
                const { folderId } = location;

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("MOVE", setLoading),
                    () =>
                        client.mutate<MoveSearchRecordResponse, MoveSearchRecordVariables>({
                            mutation: MOVE_RECORD,
                            variables: {
                                id,
                                folderId
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while moving record.");
                }

                const { data, error } = getResponseData(response, mode);

                if (!data) {
                    throw new Error(error?.message || "Could not move record.");
                }
                setRecords(prev => {
                    return prev.filter(record => record.id !== id);
                });
                setMeta(meta => ({
                    ...meta,
                    totalCount: --meta.totalCount
                }));
            },
            async deleteRecord(record) {
                if (!DELETE_RECORD) {
                    throw new Error("Missing DELETE_RECORD operation.");
                }
                const { id } = record;

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("DELETE", setLoading),
                    () =>
                        client.mutate<DeleteSearchRecordResponse, DeleteSearchRecordVariables>({
                            mutation: DELETE_RECORD,
                            variables: { id }
                        })
                );

                if (!response) {
                    throw new Error("Network error while deleting record.");
                }

                const { data, error } = getResponseData(response, mode);

                if (!data) {
                    throw new Error(error?.message || "Could not delete record");
                }

                setRecords(prev => {
                    return prev.filter(record => record.id !== id);
                });

                setMeta(meta => ({
                    ...meta,
                    totalCount: --meta.totalCount
                }));

                return true;
            },
            async listTags(params) {
                if (!LIST_TAGS) {
                    throw new Error("Missing LIST_TAGS operation.");
                }

                const { data: response } = await apolloFetchingHandler(
                    loadingHandler("LIST", setLoading),
                    () =>
                        client.query<ListTagsResponse, ListTagsQueryVariables>({
                            query: LIST_TAGS,
                            variables: {
                                where: params.where
                            }
                        })
                );

                if (!response) {
                    throw new Error("Network error while fetching tags.");
                }

                const { data, error } = getResponseData(response, mode);

                if (!data) {
                    throw new Error(error?.message || "Could not fetch tags");
                }

                setTags(data);

                return data;
            }
        };
    }, [
        app.id,
        model.modelId,
        records,
        setRecords,
        tags,
        meta,
        loading,
        GET_RECORD,
        LIST_RECORDS,
        UPDATE_RECORD,
        DELETE_RECORD,
        MOVE_RECORD,
        CREATE_RECORD,
        LIST_TAGS
    ]);

    return (
        <SearchRecordsContext.Provider value={context}>{children}</SearchRecordsContext.Provider>
    );
};
