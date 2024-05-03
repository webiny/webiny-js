import { useEffect } from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { useRecordLocking } from "~/hooks";

export const UseContentEntriesListHookDecorator =
    ContentEntryListConfig.ContentEntries.useContentEntriesList.createDecorator(originalHook => {
        return function RecordLockingUseContentEntriesList() {
            const value = originalHook();
            const recordLocking = useRecordLocking();

            useEffect(() => {
                if (!value.records) {
                    return;
                }

                recordLocking.setRecords(value.folderId, value.modelId, value.records);
            }, [value.folderId, value.modelId, value.records, recordLocking]);

            return {
                ...value,
                records: recordLocking.records
            };
        };
    });
