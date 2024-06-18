import dotPropImmutable from "dot-prop-immutable";
import { useContext, useEffect, useMemo } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { ListRecordsParams, SearchRecordsContext } from "~/contexts/records";
import { DeletableSearchRecordItem, MovableSearchRecordItem, SearchRecordItem } from "~/types";
import { useAcoApp } from "~/hooks/useAcoApp";
import { useNavigateFolder } from "~/hooks/useNavigateFolder";

export const useRecords = makeDecoratable((folderId?: string) => {
    const context = useContext(SearchRecordsContext);

    if (!context) {
        throw new Error("useSearchRecords must be used within a SearchRecordsContext");
    }

    const { folderIdPath } = useAcoApp();

    const { currentFolderId } = useNavigateFolder();

    const {
        records,
        loading,
        meta,
        listRecords,
        getRecord,
        createRecord,
        updateRecord,
        moveRecord,
        deleteRecord,
        addRecordToCache,
        updateRecordInCache,
        removeRecordFromCache
    } = context;

    useEffect(() => {
        /**
         * On first mount, call `listRecords`, which will either issue a network request, or load links from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        if (!folderId) {
            return;
        }
        const where = dotPropImmutable.set({}, folderIdPath, folderId);
        listRecords({
            where
        });
    }, [folderId]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listRecords` from this hook on component mount, because you already have folders in the `listRecords` property.
             * As soon as you call `useRecords()`, you'll initiate fetching of `records`, which is managed by the `SearchRecordContext`.
             * Since this method lists records with pagination, you might need to call it multiple times passing the `after` param.
             */
            loading,
            meta,
            records: records.filter(record => {
                const recordFolderId = dotPropImmutable.get(record, folderIdPath);
                return recordFolderId === folderId || recordFolderId === currentFolderId;
            }),
            listRecords(params: ListRecordsParams) {
                const where = dotPropImmutable.set(params.where || {}, folderIdPath, folderId);
                return listRecords({
                    ...params,
                    where
                });
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
            moveRecord(params: MovableSearchRecordItem) {
                return moveRecord(params);
            },
            deleteRecord(record: DeletableSearchRecordItem) {
                return deleteRecord(record);
            },
            addRecordToCache,
            removeRecordFromCache,
            updateRecordInCache
        }),
        [records, loading, meta, currentFolderId, folderId]
    );
});
