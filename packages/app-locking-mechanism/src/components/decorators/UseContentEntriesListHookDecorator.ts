import { useEffect } from "react";
import { useContentEntriesList } from "@webiny/app-headless-cms";
import { createDecorator } from "@webiny/app";
import { useLockingMechanism } from "~/hooks";

export const UseContentEntriesListHookDecorator = createDecorator(
    useContentEntriesList,
    originalHook => {
        return function () {
            const value = originalHook();
            const lockingMechanism = useLockingMechanism();

            useEffect(() => {
                if (!value.records) {
                    return;
                }

                lockingMechanism.setRecords(value.folderId, value.modelId, value.records);
            }, [value.folderId, value.modelId, value.records, lockingMechanism]);

            return {
                ...value,
                records: lockingMechanism.records
            };
        };
    }
);
