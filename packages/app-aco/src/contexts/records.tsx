import React, { ReactNode, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import orderBy from "lodash/orderBy";
import unionBy from "lodash/unionBy";

import { apolloFetchingHandler, loadingHandler } from "~/handlers";

import {
    CREATE_RECORD,
    DELETE_RECORD,
    GET_RECORD,
    LIST_RECORDS,
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
    UpdateSearchRecordVariables
} from "~/types";

interface SearchRecordsContext {
    records: SearchRecordItem[];
    loading: Loading<LoadingActions>;
    meta: Meta<ListMeta>;
    listRecords: (
        type?: string,
        folderId?: string,
        limit?: number,
        after?: string,
        sort?: string[]
    ) => Promise<SearchRecordItem[]>;
    getRecord: (id: string) => Promise<SearchRecordItem>;
    createRecord: (record: Omit<SearchRecordItem, "id">) => Promise<SearchRecordItem>;
    updateRecord: (record: SearchRecordItem, contextFolderId?: string) => Promise<SearchRecordItem>;
    deleteRecord(record: SearchRecordItem): Promise<true>;
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

export const SearchRecordsProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const [records, setRecords] = useState<SearchRecordItem[]>([]);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const [meta, setMeta] = useState<Meta<ListMeta>>(Object.create(null));

    const context: SearchRecordsContext = {
        records,
        loading,
        meta,
        async listRecords(
            type?: string,
            folderId?: string,
            limit = 20,
            after?: string,
            sorting?: string[]
        ) {
            if (!folderId || !type) {
                throw new Error("`folderId` and `type` are mandatory");
            }

            /*
             * Avoiding to fetch records in case they have already been fetched.
             * This happens when visiting a list with all records loaded and receives "after" param.
             */
            const recordsCount = records.filter(
                record => record.location.folderId === folderId
            ).length;
            const totalCount = meta[folderId]?.totalCount || 0;
            if (after && recordsCount === totalCount) {
                return;
            }

            // Remove records in case of sorting change and not a paginated request.
            if (sorting && !after) {
                setRecords([]);
            }

            const action = after ? "LIST_MORE" : "LIST";
            const sort = sorting && sorting.length > 0 ? sorting : ["savedOn_DESC"];

            const { data: response } = await apolloFetchingHandler(
                loadingHandler(action, setLoading),
                () =>
                    client.query<ListSearchRecordsResponse, ListSearchRecordsQueryVariables>({
                        query: LIST_RECORDS,
                        variables: { type, location: { folderId }, limit, after, sort },
                        fetchPolicy: "network-only"
                    })
            );

            const { data, meta: responseMeta, error } = response.search.listRecords;

            if (!data || !responseMeta) {
                throw new Error(error?.message || "Could not fetch records");
            }

            // Adjusting sorting while merging records with data received from the server.
            const fields = sort.map(s => s.split("_")[0]);
            const orders = sort.map(s => s.split("_")[1].toLowerCase() as "asc" | "desc");
            setRecords(records => orderBy(unionBy(data, records, "id"), fields, orders));

            setMeta(meta => ({
                ...meta,
                [folderId]: responseMeta
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
                setRecords(records => records.filter(record => record.id !== id));
            } else {
                setRecords(prevRecords => {
                    const recordIndex = prevRecords.findIndex(record => record.id === id);

                    // No record found in the list - must be added by previous operation
                    if (recordIndex === -1) {
                        return [...prevRecords, data];
                    }

                    // Updating record found in the list
                    const result = [
                        ...prevRecords.slice(0, recordIndex),
                        {
                            ...prevRecords[recordIndex],
                            ...data
                        },
                        ...prevRecords.slice(recordIndex + 1)
                    ];

                    return result;
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

            setRecords(records => [...records, data]);

            setMeta(meta => ({
                ...meta,
                [folderId]: {
                    ...meta[folderId],
                    totalCount: ++meta[folderId].totalCount
                }
            }));

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

            const { result, error } = response.search.updateRecord;

            if (!result) {
                throw new Error(error?.message || "Could not update record");
            }

            setRecords(records =>
                records
                    .map(record => (record.id === id ? result : record))
                    .filter(record => record.location.folderId === contextFolderId)
            );

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
                throw new Error("Network error while deleting record");
            }

            const { data, error } = response.search.deleteRecord;

            if (!data) {
                throw new Error(error?.message || "Could not delete record");
            }

            setRecords(records => records.filter(record => record.id !== id));

            setMeta(meta => ({
                ...meta,
                [folderId]: {
                    ...meta[folderId],
                    totalCount: --meta[folderId].totalCount
                }
            }));

            return true;
        }
    };

    return (
        <SearchRecordsContext.Provider value={context}>{children}</SearchRecordsContext.Provider>
    );
};
