import { useEffect, useState } from "react";
import { useContentEntriesList } from "@webiny/app-headless-cms";
import { createDecorator } from "@webiny/app";
import { useLockingMechanism } from "~/hooks";
import { IPossiblyLockingMechanismRecord } from "~/types";

export const UseContentEntriesListHookDecorator = createDecorator(
    useContentEntriesList,
    originalHook => {
        return function () {
            const value = originalHook();
            const lockingMechanism = useLockingMechanism();

            const [records, setRecords] = useState<IPossiblyLockingMechanismRecord[]>([]);

            useEffect(() => {
                setRecords(value.records);
            }, [value.records]);

            useEffect(() => {
                if (records.length === 0) {
                    return;
                }

                lockingMechanism.setRecords(
                    value.folderId,
                    value.modelId,
                    records,
                    async result => {
                        setRecords(result);
                    }
                );
            }, [value.modelId, records, setRecords]);

            console.log("records", records);

            return {
                ...value,
                records
            };
        };
    }
);
