import React, { ReactNode, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import sortBy from "lodash/sortBy";
import unionBy from "lodash/unionBy";
import { apolloFetchingHandler, loadingHandler } from "~/handlers";
import {
    createCreateRecord,
    createDeleteRecord,
    createGetRecord,
    createListRecords,
    createListTags,
    createUpdateRecord
} from "~/graphql/records.gql";
import {
    CreateSearchRecordResponse,
    CreateSearchRecordVariables,
    DeleteSearchRecordResponse,
    DeleteSearchRecordVariables,
    GetSearchRecordQueryVariables,
    GetSearchRecordResponse,
    ListDbSort,
    ListMeta,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsResponse,
    ListSearchRecordsWhereQueryVariables,
    ListTagsQueryVariables,
    ListTagsResponse,
    ListTagsWhereQueryVariables,
    Loading,
    LoadingActions,
    Meta,
    SearchRecordItem,
    TagItem,
    UpdateSearchRecordResponse,
    UpdateSearchRecordVariables
} from "~/types";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";
import { useAcoApp } from "~/hooks";

interface ListTagsParams {
    where?: ListTagsWhereQueryVariables & {
        AND?: ListTagsWhereQueryVariables[];
        OR?: ListTagsWhereQueryVariables[];
    };
}

interface SearchRecordsContext {
    records: SearchRecordItem[];
    tags: TagItem[];
    loading: Loading<LoadingActions>;
    meta: Meta<ListMeta>;
    listRecords: (params: {
        folderId?: string;
        limit?: number;
        after?: string;
        sort?: ListDbSort;
        search?: string;
        createdBy?: string;
        tags_in?: string[];
        tags_startsWith?: string;
        tags_not_startsWith?: string;
        AND?: ListSearchRecordsWhereQueryVariables[];
        OR?: ListSearchRecordsWhereQueryVariables[];
    }) => Promise<SearchRecordItem[]>;
    getRecord: (id: string) => Promise<SearchRecordItem | null>;
    createRecord: (record: Omit<SearchRecordItem, "id">) => Promise<SearchRecordItem>;
    updateRecord: (record: SearchRecordItem, contextFolderId?: string) => Promise<SearchRecordItem>;
    deleteRecord(record: SearchRecordItem): Promise<true>;
    listTags: (params: ListTagsParams) => Promise<TagItem[]>;
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
    CREATE: false,
    UPDATE: false,
    DELETE: false
};

const mergeRecords = (
    oldRecords: SearchRecordItem[],
    newRecords: SearchRecordItem[]
): SearchRecordItem[] => {
    if (!newRecords.length) {
        return oldRecords;
    }

    const mergedRecords = newRecords.reduce(
        (items, record) => {
            const index = items.findIndex(item => item.id === record.id);
            if (index === -1) {
                items.push(record);
                return items;
            }
            items[index] = record;
            return items;
        },
        [...oldRecords]
    ); // merge the two arrays

    return sortBy(mergedRecords, ["title"]);
};

const mergeAndSortTags = (oldTagItems: TagItem[], newTags: string[]): TagItem[] => {
    if (!newTags.length) {
        return oldTagItems;
    }

    const newTagItems = newTags.map((tag: string) => ({ tag })); // create TagItem[] from array of strings
    const mergedTagItems = unionBy(oldTagItems, newTagItems, "tag"); // merge the two arrays

    return sortBy(mergedTagItems, ["tag"]);
};

export const SearchRecordsProvider: React.VFC<Props> = ({ children }) => {
    const client = useApolloClient();

    const { app } = useAcoApp();
    const { model } = app;

    const [records, setRecords] = useState<SearchRecordItem[]>([]);
    const [tags, setTags] = useState<TagItem[]>([]);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const [meta, setMeta] = useState<Meta<ListMeta>>(Object.create(null));

    const { GET_RECORD, LIST_RECORDS, UPDATE_RECORD, DELETE_RECORD, CREATE_RECORD, LIST_TAGS } =
        useMemo(() => {
            return {
                LIST_RECORDS: createListRecords(model),
                UPDATE_RECORD: createUpdateRecord(model),
                GET_RECORD: createGetRecord(model),
                LIST_TAGS: createListTags(model),
                DELETE_RECORD: createDeleteRecord(model),
                CREATE_RECORD: createCreateRecord(model)
            };
        }, [app.id, model.modelId]);

    const context = useMemo<SearchRecordsContext>(() => {
        return {
            records,
            tags,
            loading,
            meta,
            async listRecords(params) {
                const {
                    folderId,
                    after,
                    limit,
                    sort: sorting,
                    search,
                    createdBy,
                    tags_in,
                    tags_startsWith,
                    tags_not_startsWith,
                    AND,
                    OR
                } = params;

                /**
                 * Avoiding to fetch records in case they have already been fetched.
                 * This happens when visiting a list with all records loaded and receives "after" param.
                 */
                const recordsCount = records.filter(
                    record => record.location.folderId === folderId
                ).length;
                const totalCount = meta[folderId || "search"]?.totalCount || 0;
                if (after && recordsCount === totalCount) {
                    return records;
                }

                // Remove records in case of sorting change and not a paginated request.
                if (sorting && !after) {
                    setRecords([]);
                }

                const action = after ? "LIST_MORE" : "LIST";
                const sort = validateOrGetDefaultDbSort(sorting);

                const { data: response } = await apolloFetchingHandler<ListSearchRecordsResponse>(
                    loadingHandler(action, setLoading),
                    () =>
                        client.query<ListSearchRecordsResponse, ListSearchRecordsQueryVariables>({
                            query: LIST_RECORDS,
                            variables: {
                                where: {
                                    type: app.id,
                                    ...(folderId && { location: { folderId } }),
                                    tags_in,
                                    tags_startsWith,
                                    tags_not_startsWith,
                                    createdBy,
                                    AND,
                                    OR
                                },
                                search,
                                limit,
                                after,
                                sort
                            },
                            fetchPolicy: "network-only"
                        })
                );

                if (!response) {
                    throw new Error("Could not fetch records - no response.");
                }

                const { data, meta: responseMeta, error } = response.search.listRecords;

                if (!data || !responseMeta) {
                    throw new Error(error?.message || "Could not fetch records");
                }

                setRecords(prev => {
                    /**
                     * In case of paginated request, we merge the fetched records with the existing ones, and then sort them.
                     * Otherwise, we sort the fetched records and set them as the new records.
                     */
                    return sortTableItems(mergeRecords(after ? prev : [], data));
                });

                setMeta(meta => ({
                    ...meta,
                    [folderId || "search"]: responseMeta
                }));

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

                const { data: response } = await apolloFetchingHandler<GetSearchRecordResponse>(
                    loadingHandler("GET", setLoading),
                    () =>
                        client.query<GetSearchRecordResponse, GetSearchRecordQueryVariables>({
                            query: GET_RECORD,
                            variables: { id },
                            fetchPolicy: "network-only"
                        })
                );

                if (!response) {
                    throw new Error(`Could not fetch record "${id}" - no response.`);
                }

                const { data, error } = response.search.getRecord;

                if (error && error.code !== "NOT_FOUND") {
                    throw new Error("Network error while syncing record");
                }

                if (!data) {
                    // No record found - must be deleted by previous operation
                    setRecords(prev => {
                        return prev.filter(record => record.id !== id);
                    });
                    return data;
                }
                setRecords(prev => {
                    const index = prev.findIndex(record => record.id === id);

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
                const { location } = record;
                const { folderId } = location;

                const { data: response } = await apolloFetchingHandler<CreateSearchRecordResponse>(
                    loadingHandler("CREATE", setLoading),
                    () =>
                        client.mutate<CreateSearchRecordResponse, CreateSearchRecordVariables>({
                            mutation: CREATE_RECORD,
                            variables: { data: record }
                        })
                );

                if (!response) {
                    throw new Error("Network error while creating search record.");
                }

                const { data, error } = response.search.createRecord;

                if (!data) {
                    throw new Error(error?.message || "Could not create record");
                }

                setRecords(prev => {
                    return [...prev, data];
                });

                setMeta(meta => ({
                    ...meta,
                    [folderId]: {
                        ...meta[folderId],
                        totalCount: ++meta[folderId].totalCount
                    }
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

                const { data: result, error } = response.search.updateRecord;

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

            async deleteRecord(record) {
                const { id, location } = record;
                const { folderId } = location;

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

                const { data, error } = response.search.deleteRecord;

                if (!data) {
                    throw new Error(error?.message || "Could not delete record");
                }

                setRecords(prev => {
                    return prev.filter(record => record.id !== id);
                });

                setMeta(meta => ({
                    ...meta,
                    [folderId]: {
                        ...meta[folderId],
                        totalCount: --meta[folderId].totalCount
                    }
                }));

                return true;
            },

            async listTags(params) {
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

                const { data, error } = response.search.listTags;

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
        tags,
        meta,
        loading,
        GET_RECORD,
        LIST_RECORDS,
        UPDATE_RECORD,
        DELETE_RECORD,
        CREATE_RECORD,
        LIST_TAGS
    ]);

    return (
        <SearchRecordsContext.Provider value={context}>{children}</SearchRecordsContext.Provider>
    );
};
