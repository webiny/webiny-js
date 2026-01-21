import { useEffect } from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { useRecordLocking } from "~/hooks/index.js";
import type { IPossiblyRecordLockingRecord } from "~/types.js";

export const UseContentEntriesListHookDecorator =
    ContentEntryListConfig.ContentEntries.useContentEntriesList.createDecorator(originalHook => {
        return function RecordLockingUseContentEntriesList() {
            const value = originalHook();
            const recordLocking = useRecordLocking();

            useEffect(() => {
                if (!value.records) {
                    return;
                }
                recordLocking.setRecords(
                    value.folderId,
                    value.modelId,
                    // TODO determine if this is correct
                    value.records as IPossiblyRecordLockingRecord[]
                );
            }, [value.folderId, value.modelId, value.records, recordLocking]);

            return {
                ...value,
                records: recordLocking.records
            };
        };
    });
