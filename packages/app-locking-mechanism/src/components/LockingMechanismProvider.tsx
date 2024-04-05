import React, { useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { createLockingMechanism } from "~/domain/LockingMechanism";
import { ILockingMechanismContext, IPossiblyLockingMechanismRecord } from "~/types";

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

    const value = useMemo<ILockingMechanismContext>(() => {
        return {
            isRecordLocked(record) {
                return lockingMechanism.isRecordLocked(record);
            },
            async setRecords(type, records, cb) {
                await lockingMechanism.setRecords(type, records, cb);
            },
            records: lockingMechanism.records
        };
    }, []);

    return <LockingMechanismContext.Provider {...props} value={value} />;
};
