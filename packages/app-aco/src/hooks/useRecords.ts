import { useContext, useEffect, useMemo } from "react";
import { SearchRecordsContext } from "~/contexts/records";
import { SearchRecordItem } from "~/types";

export const useRecords = (type?: string, folderId?: string) => {
    const context = useContext(SearchRecordsContext);

    if (!context) {
        throw new Error("useSearchRecords must be used within a SearchRecordsContext");
    }

    const {
        records,
        loading,
        meta,
        listRecords,
        getRecord,
        createRecord,
        updateRecord,
        deleteRecord
    } = context;

    useEffect(() => {
        /**
         * On first mount, call `listRecords`, which will either issue a network request, or load links from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        if (type && folderId) {
            listRecords(type, folderId);
        }
    }, [type, folderId]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listRecords` from this hook on component mount, because you already have folders in the `listRecords` property.
             * As soon as you call `useSearchRecords()`, you'll initiate fetching of `records`, which is managed by the `SearchRecordContext`.
             * Since this method lists records with pagination, you might need to call it multiple times passing the `after` param.
             */
            loading,
            meta: meta[folderId!] || {},
            records: records.filter(record => record.location.folderId === folderId),
            listRecords(params: { after?: string; limit?: number; sort?: string[] }) {
                return listRecords(type, folderId, params.limit, params.after, params.sort);
            },
            getRecord(id: string) {
                return getRecord(id);
            },
            createRecord(record: Omit<SearchRecordItem, "id">) {
                return createRecord(record);
            },
            updateRecord(record: SearchRecordItem) {
                return updateRecord(record, folderId);
            },
            deleteRecord(record: SearchRecordItem) {
                return deleteRecord(record);
            }
        }),
        [records, loading, meta]
    );
};
