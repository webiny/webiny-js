import React, { useEffect } from "react";
import { ContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useLockingMechanism } from "~/hooks";
import { LockedRecord } from "./LockedRecord";
import { IIsRecordLockedParams, IUpdateEntryLockParams } from "~/types";

export interface IContentEntryLockerProps {
    record: IUpdateEntryLockParams;
    savedOn: string;
    children: React.ReactElement;
}

const ContentEntryLocker = ({ children, record, savedOn }: IContentEntryLockerProps) => {
    const { updateEntryLock } = useLockingMechanism();

    useEffect(() => {
        updateEntryLock(record);
    }, [record.id, savedOn]);

    return children;
};

export const HeadlessCmsContentEntry = ContentEntry.createDecorator(Original => {
    return function LockingMechanismContentEntry(props) {
        const { loading, entry, contentModel } = useContentEntry();

        const { isRecordLocked, loading: lockingMechanismLoading } = useLockingMechanism();

        if (loading || !entry?.id) {
            return <Original {...props} />;
        } else if (lockingMechanismLoading) {
            return <div>Loading locking mechanism...</div>;
        }
        const record: IIsRecordLockedParams = {
            id: entry.id,
            $lockingType: contentModel.modelId
        };

        if (isRecordLocked(record)) {
            return <LockedRecord id={record.id} />;
        }

        return (
            <ContentEntryLocker record={record} savedOn={entry.revisionSavedOn}>
                <Original {...props} />
            </ContentEntryLocker>
        );
    };
});
