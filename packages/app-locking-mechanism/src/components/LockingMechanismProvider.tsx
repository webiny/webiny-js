import React, { useCallback, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { createLockingMechanism } from "~/domain/LockingMechanism";
import { ILockingMechanismContext, IPossiblyLockingMechanismRecord } from "~/types";
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

    const lockingMechanism = useMemo(() => {
        return createLockingMechanism({
            client
        });
    }, []);
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
        isRecordLocked(record) {
            return lockingMechanism.isRecordLocked(record);
        },
        getLockRecordEntry(id: string) {
            return lockingMechanism.getLockRecordEntry(id);
        },
        async setRecords(folderId, type, newRecords) {
            setRecordsIfNeeded(newRecords);
            // console.log("in setRecords before load", newRecords);
            const result = await lockingMechanism.setRecords(folderId, type, newRecords);
            if (!result) {
                return;
            }
            setRecords(result);
        },
        records,
        loading: lockingMechanism.loading
    };

    return <LockingMechanismContext.Provider {...props} value={value} />;
};
