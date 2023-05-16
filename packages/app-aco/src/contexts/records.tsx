import React, { ReactNode, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import sortBy from "lodash/sortBy";
import unionBy from "lodash/unionBy";

import { apolloFetchingHandler, loadingHandler } from "~/handlers";

import {
    CREATE_RECORD,
    DELETE_RECORD,
    GET_RECORD,
    LIST_RECORDS,
    LIST_TAGS,
    UPDATE_RECORD
} from "~/graphql/records.gql";

import {
    CreateSearchRecordResponse,
    CreateSearchRecordVariables,
    DeleteSearchRecordResponse,
    DeleteSearchRecordVariables,
    GetSearchRecordQueryVariables,
    GetSearchRecordResponse,
    SearchRecordItem,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsResponse,
    ListMeta,
    Loading,
    LoadingActions,
    Meta,
    UpdateSearchRecordResponse,
    UpdateSearchRecordVariables,
    ListDbSort,
    ListTagsResponse,
    ListTagsQueryVariables,
    TagItem,
    ListSearchRecordsWhereQueryVariables,
    ListTagsWhereQueryVariables
} from "~/types";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";

interface SearchRecordsContext {
    records: Record<string, SearchRecordItem[]>;
    tags: Record<string, TagItem[]>;
    loading: Loading<LoadingActions>;
    meta: Meta<ListMeta>;
    listRecords: (params: {
        type?: string;
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
    getRecord: (id: string) => Promise<SearchRecordItem>;
    createRecord: (record: Omit<SearchRecordItem, "id">) => Promise<SearchRecordItem>;
    updateRecord: (record: SearchRecordItem, contextFolderId?: string) => Promise<SearchRecordItem>;
    deleteRecord(record: SearchRecordItem): Promise<true>;
    listTags: (
        params: ListTagsWhereQueryVariables & {
            type: string;
            AND?: [ListTagsWhereQueryVariables];
            OR?: [ListTagsWhereQueryVariables];
        }
    ) => Promise<TagItem[]>;
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

const mergeAndSortTags = (oldTagItems: TagItem[], newTags: string[]): TagItem[] => {
    if (!newTags.length) {
        return oldTagItems;
    }

    const newTagItems = newTags.map((tag: string) => ({ tag })); // create TagItem[] from array of strings
    const mergedTagItems = unionBy(oldTagItems, newTagItems, "tag"); // merge the two arrays

    return sortBy(mergedTagItems, ["tag"]);
};

export const SearchRecordsProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const [records, setRecords] = useState<Record<string, SearchRecordItem[]>>(Object.create(null));
    const [tags, setTags] = useState<Record<string, TagItem[]>>(Object.create(null));
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const [meta, setMeta] = useState<Meta<ListMeta>>(Object.create(null));

    const context: SearchRecordsContext = {
        records,
        tags,
        loading,
        meta,
        async listRecords(params) {
            const {
                type,
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
             * Both folderId and type are optional to init `useRecords` but required to list records:
             * this allows us to use `useRecords` methods like `getRecord` without passing useless params.
             * But still, we need these params to list records.
             */
            if (!type) {
                throw new Error("`type` are mandatory");
            }

            /**
             * Avoiding to fetch records in case they have already been fetched.
             * This happens when visiting a list with all records loaded and receives "after" param.
             */
            const recordsCount =
                records[type] &&
                records[type].filter(record => record.location.folderId === folderId).length;
            const totalCount = meta[folderId || "search"]?.totalCount || 0;
            if (after && recordsCount === totalCount) {
                return;
            }

            // Remove records in case of sorting change and not a paginated request.
            if (sorting && !after) {
                setRecords(records => ({
                    ...records,
                    [type]: []
                }));
            }

            const action = after ? "LIST_MORE" : "LIST";
            const sort = validateOrGetDefaultDbSort(sorting);

            const { data: response } = await apolloFetchingHandler(
                loadingHandler(action, setLoading),
                () =>
                    client.query<ListSearchRecordsResponse, ListSearchRecordsQueryVariables>({
                        query: LIST_RECORDS,
                        variables: {
                            where: {
                                type,
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

            const { data, meta: responseMeta, error } = response.search.listRecords;

            if (!data || !responseMeta) {
                throw new Error(error?.message || "Could not fetch records");
            }

            setRecords(records => {
                // In case of paginated request, we merge the fetched records with the existing ones, after sorting them.
                if (after) {
                    return {
                        ...records,
                        [type]: sortTableItems(unionBy(data, records[type], "id"), sort)
                    };
                }

                // Otherwise, we return the fetched records after sorting them.
                return {
                    ...records,
                    [type]: sortTableItems(data, sort)
                };
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

            const { data: response } = await apolloFetchingHandler(
                loadingHandler("GET", setLoading),
                () =>
                    client.query<GetSearchRecordResponse, GetSearchRecordQueryVariables>({
                        query: GET_RECORD,
                        variables: { id },
                        fetchPolicy: "network-only"
                    })
            );

            const { data, error } = response.search.getRecord;

            if (error && error.code !== "NOT_FOUND") {
                throw new Error("Network error while syncing record");
            }

            if (!data) {
                // No record found - must be deleted by previous operation
                setRecords(records => {
                    const currentRecord = Object.keys(records)
                        .reduce((accumulator, current) => {
                            return [...accumulator, ...records[current]];
                        }, [] as SearchRecordItem[])
                        .find(record => record.id === id);

                    if (!currentRecord) {
                        return records;
                    }

                    return {
                        ...records,
                        [currentRecord.type]: records[currentRecord.type].filter(
                            record => record.id !== id
                        )
                    };
                });
            } else {
                setRecords(prevRecords => {
                    const prevRecordsByType = prevRecords[data.type];

                    const recordIndex = prevRecordsByType.findIndex(record => record.id === id);

                    // No record found in the list - must be added by previous operation
                    if (recordIndex === -1) {
                        return { ...prevRecords, [data.type]: [data, ...prevRecordsByType] };
                    }

                    // Updating record found in the list
                    const result = {
                        ...prevRecords,
                        [data.type]: [
                            ...prevRecordsByType.slice(0, recordIndex),
                            {
                                ...prevRecordsByType[recordIndex],
                                ...data
                            },
                            ...prevRecordsByType.slice(recordIndex + 1)
                        ]
                    };

                    return result;
                });

                setTags(tags => {
                    if (!data.tags || data.tags.length === 0) {
                        return tags;
                    }

                    const tagsByType = tags[data.type]; // get existing tags

                    return {
                        ...tags,
                        [data.type]: mergeAndSortTags(tagsByType, data.tags)
                    };
                });
            }

            return data;
        },

        async createRecord(record) {
            const { location } = record;
            const { folderId } = location;

            const { data: response } = await apolloFetchingHandler(
                loadingHandler("CREATE", setLoading),
                () =>
                    client.mutate<CreateSearchRecordResponse, CreateSearchRecordVariables>({
                        mutation: CREATE_RECORD,
                        variables: { data: record }
                    })
            );

            if (!response) {
                throw new Error("Network error while creating search record");
            }

            const { data, error } = response.search.createRecord;

            if (!data) {
                throw new Error(error?.message || "Could not create record");
            }

            setRecords(records => ({
                ...records,
                [data.type]: [...records[data.type], data]
            }));

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

                const tagsByType = tags[data.type]; // get existing tags

                return {
                    ...tags,
                    [data.type]: mergeAndSortTags(tagsByType, data.tags)
                };
            });

            return data;
        },

        async updateRecord(record, contextFolderId) {
            if (!contextFolderId) {
                throw new Error("`folderId` is mandatory");
            }

            const { id, location, data, title, content, type } = record;

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

            setRecords(records => ({
                ...records,
                [type]: records[type]
                    .map(record => (record.id === id ? result : record))
                    .filter(record => record.location.folderId === contextFolderId)
            }));

            setTags(tags => {
                if (!data.tags || data.tags.length === 0) {
                    return tags;
                }

                const tagsByType = tags[data.type]; // get existing tags

                return {
                    ...tags,
                    [data.type]: mergeAndSortTags(tagsByType, data.tags)
                };
            });

            return result;
        },

        async deleteRecord(record) {
            const { id, location, type } = record;
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
                throw new Error("Network error while deleting record");
            }

            const { data, error } = response.search.deleteRecord;

            if (!data) {
                throw new Error(error?.message || "Could not delete record");
            }

            setRecords(records => ({
                ...records,
                [type]: records[type].filter(record => record.id !== id)
            }));

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
            const { type } = params;

            if (!type) {
                throw new Error("`type` is mandatory");
            }

            const { data: response } = await apolloFetchingHandler(
                loadingHandler("LIST", setLoading),
                () =>
                    client.query<ListTagsResponse, ListTagsQueryVariables>({
                        query: LIST_TAGS,
                        variables: {
                            where: params
                        }
                    })
            );

            const { data, error } = response.search.listTags;

            if (!data) {
                throw new Error(error?.message || "Could not fetch tags");
            }

            setTags(tags => ({
                ...tags,
                [type]: data
            }));

            return data;
        }
    };

    return (
        <SearchRecordsContext.Provider value={context}>{children}</SearchRecordsContext.Provider>
    );
};
