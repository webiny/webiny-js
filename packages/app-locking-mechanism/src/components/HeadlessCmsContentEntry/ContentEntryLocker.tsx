import { useContentEntry } from "@webiny/app-headless-cms";
import React, { useEffect } from "react";
import { useLockingMechanism } from "~/hooks";
import { IIsRecordLockedParams } from "~/types";

export interface IContentEntryLockerProps {
    children: React.ReactElement;
}

export const ContentEntryLocker = ({ children }: IContentEntryLockerProps) => {
    const { entry, contentModel: model } = useContentEntry();
    const { updateEntryLock, unlockEntry, fetchIsEntryLocked } = useLockingMechanism();

    useEffect(() => {
        if (!entry.id) {
            return;
        }

        const record: IIsRecordLockedParams = {
            id: entry.id,
            $lockingType: model.modelId
        };
        updateEntryLock(record);

        return () => {
            (async () => {
                const result = await fetchIsEntryLocked(record);
                if (result) {
                    return;
                }
                unlockEntry(record);
            })();
        };
    }, [entry.id]);

    return children;
};
