import React, { useCallback, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { createRecordLocking } from "~/domain/RecordLocking.js";
import type {
    IFetchLockedEntryLockRecordParams,
    IFetchLockRecordParams,
    IPossiblyRecordLockingRecord,
    IRecordLockingContext,
    IRecordLockingError,
    IUnlockEntryParams,
    IUpdateEntryLockParams
} from "~/types.js";
import { useStateIfMounted } from "@webiny/app-admin";

export interface IRecordLockingProviderProps {
    children: React.ReactNode;
}

export const RecordLockingContext = React.createContext({} as unknown as IRecordLockingContext);

const isSameArray = (
    existingRecords: Pick<IPossiblyRecordLockingRecord, "id" | "savedOn">[],
    newRecords: Pick<IPossiblyRecordLockingRecord, "id" | "savedOn">[]
): boolean => {
    if (existingRecords.length !== newRecords.length) {
        return false;
    }
    return existingRecords.every((record, index) => {
        const newRecord = newRecords[index];
        if (!newRecord) {
            return false;
        }

        return newRecord.id === record.id && newRecord.savedOn === record.savedOn;
    });
};

const getData = (records: IPossiblyRecordLockingRecord[]) => {
    return records.map(record => ({
        id: record.id,
        savedOn: record.savedOn
    }));
};

export const RecordLockingProvider = (props: IRecordLockingProviderProps) => {
    const client = useApolloClient();

    const [loading, setLoading] = useState(false);

    const recordLocking = useMemo(() => {
        return createRecordLocking({
            client,
            setLoading
        });
    }, []);

    const [error, setError] = useStateIfMounted<IRecordLockingError | null>(null);

    const [records, setRecords] = useStateIfMounted<IPossiblyRecordLockingRecord[]>([]);

    const setRecordsIfNeeded = useCallback(
        (newRecords: IPossiblyRecordLockingRecord[]) => {
            const sameArray = isSameArray(getData(records), getData(newRecords));
            if (sameArray) {
                return;
            }
            setRecords(newRecords);
        },
        [records]
    );

    const value: IRecordLockingContext = {
        async updateEntryLock(params: IUpdateEntryLockParams) {
            const result = await recordLocking.updateEntryLock(params);
            if (result.error) {
                setError(result.error);
                return result;
            }
            const target = result.data;
            if (!target?.id) {
                const error = {
                    message: "No data returned from server.",
                    code: "NO_DATA"
                };
                setError(error);
                return {
                    error,
                    data: null
                };
            }

            setRecords(prev => {
                return prev.map(item => {
                    if (item.entryId === target.id) {
                        return {
                            ...item,
                            $locked: result.data
                        };
                    }
                    return item;
                });
            });
            return result;
        },
        async unlockEntry(params: IUnlockEntryParams) {
            return await recordLocking.unlockEntry(params);
        },
        async unlockEntryForce(params: IUnlockEntryParams) {
            return await recordLocking.unlockEntry(params, true);
        },
        isLockExpired(input: Date | string): boolean {
            return recordLocking.isLockExpired(input);
        },
        isRecordLocked(record) {
            if (!record) {
                return false;
            }
            return recordLocking.isRecordLocked(record);
        },
        getLockRecordEntry(id: string) {
            return recordLocking.getLockRecordEntry(id);
        },
        removeEntryLock(params: IUnlockEntryParams) {
            return recordLocking.removeEntryLock(params);
        },
        async fetchLockRecord(params: IFetchLockRecordParams) {
            try {
                return await recordLocking.fetchLockRecord(params);
            } catch (ex) {
                return {
                    data: null,
                    error: ex
                };
            }
        },
        async fetchLockedEntryLockRecord(params: IFetchLockedEntryLockRecordParams) {
            return recordLocking.fetchLockedEntryLockRecord(params);
        },
        async setRecords(folderId, type, newRecords) {
            setRecordsIfNeeded(newRecords);

            const result = await recordLocking.setRecords(folderId, type, newRecords);
            if (!result) {
                return;
            }
            setRecords(result);
        },
        error,
        records,
        loading
    };

    return <RecordLockingContext.Provider {...props} value={value} />;
};
