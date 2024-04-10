import React, { useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { createLockingMechanism } from "~/domain/LockingMechanism";
import {
    ILockingMechanismContext,
    ILockingMechanismRecord,
    IPossiblyLockingMechanismRecord
} from "~/types";

export interface ILockingMechanismProviderProps {
    children: React.ReactNode;
}

export const LockingMechanismContext = React.createContext(
    {} as unknown as ILockingMechanismContext
);

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

    const [records, setRecords] = useState<IPossiblyLockingMechanismRecord[]>();

    const value: ILockingMechanismContext = {
        isRecordLocked(record) {
            return lockingMechanism.isRecordLocked(record);
        },
        async setRecords(folderId, type, records) {
            setRecords(records);
            const result = await lockingMechanism.setRecords(folderId, type, records);
            if (!result) {
                return;
            }
            setRecords(result);
        },
        records: records || []
    };

    return <LockingMechanismContext.Provider {...props} value={value} />;
};
