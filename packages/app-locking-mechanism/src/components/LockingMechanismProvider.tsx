import React, { useCallback, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { createLockingMechanism } from "~/domain/LockingMechanism";
import {
    IFetchIsEntryLockedParams,
    IFetchLockRecordParams,
    ILockingMechanismContext,
    ILockingMechanismError,
    IPossiblyLockingMechanismRecord,
    IUnlockEntryParams,
    IUpdateEntryLockParams
} from "~/types";
import { useStateIfMounted } from "@webiny/app-admin";

export interface ILockingMechanismProviderProps {
    children: React.ReactNode;
}

export const LockingMechanismContext = React.createContext(
    {} as unknown as ILockingMechanismContext
);

const isSameArray = (
    existingRecords: Pick<IPossiblyLockingMechanismRecord, "id">[],
    newRecords: Pick<IPossiblyLockingMechanismRecord, "id">[]
): boolean => {
    if (existingRecords.length !== newRecords.length) {
        return false;
    }
    return existingRecords.every(record => {
        return newRecords.some(newRecord => newRecord.id === record.id);
    });
};

export const LockingMechanismProvider = (props: ILockingMechanismProviderProps) => {
    // const websockets = useWebsockets();
    const client = useApolloClient();
    // TODO methods
    // check if entry is locked
    // lock entry - enter entry
    // unlock entry - exit entry
    // reject access
    // accept access request

    // TODO events
    // request access

    const [loading, setLoading] = useState(false);

    const lockingMechanism = useMemo(() => {
        return createLockingMechanism({
            client,
            setLoading
        });
    }, []);

    const [error, setError] = useStateIfMounted<ILockingMechanismError | null>(null);

    const [records, setRecords] = useStateIfMounted<IPossiblyLockingMechanismRecord[]>([]);

    const setRecordsIfNeeded = useCallback(
        (newRecords: IPossiblyLockingMechanismRecord[]) => {
            const sameArray = isSameArray(records, newRecords);
            if (sameArray) {
                return;
            }
            setRecords(newRecords);
        },
        [records]
    );

    const value: ILockingMechanismContext = {
        async updateEntryLock(params: IUpdateEntryLockParams) {
            const result = await lockingMechanism.updateEntryLock(params);
            if (result.error) {
                setError(result.error);
                return;
            }
            const target = result.data;
            if (!target?.id) {
                setError({
                    message: "No data returned from server.",
                    code: "NO_DATA"
                });
                return;
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
        },
        async unlockEntry(params: IUnlockEntryParams) {
            return await lockingMechanism.unlockEntry(params);
        },
        async unlockEntryForce(params: IUnlockEntryParams) {
            return await lockingMechanism.unlockEntry(params, true);
        },
        isLockExpired(input: Date | string): boolean {
            return lockingMechanism.isLockExpired(input);
        },
        isRecordLocked(record) {
            if (!record) {
                return false;
            }
            return lockingMechanism.isRecordLocked(record);
        },
        getLockRecordEntry(id: string) {
            return lockingMechanism.getLockRecordEntry(id);
        },
        async fetchLockRecord(params: IFetchLockRecordParams) {
            try {
                return await lockingMechanism.fetchLockRecord(params);
            } catch (ex) {
                return {
                    data: null,
                    error: ex
                };
            }
        },
        async fetchIsEntryLocked(params: IFetchIsEntryLockedParams) {
            return lockingMechanism.fetchIsEntryLocked(params);
        },
        async setRecords(folderId, type, newRecords) {
            setRecordsIfNeeded(newRecords);

            const result = await lockingMechanism.setRecords(folderId, type, newRecords);
            if (!result) {
                return;
            }
            setRecords(result);
        },
        error,
        records,
        loading
    };

    return <LockingMechanismContext.Provider {...props} value={value} />;
};
