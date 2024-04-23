import React, { useEffect, useMemo } from "react";
import { ContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry";
import { useContentEntriesList, useContentEntry } from "@webiny/app-headless-cms";
import { useLockingMechanism } from "~/hooks";
import { LockedRecord } from "./LockedRecord";
import { IIsRecordLockedParams } from "~/types";
import { CmsContentEntry, CmsModel } from "@webiny/app-headless-cms/types";

export interface IContentEntryLockerProps {
    entry: CmsContentEntry;
    model: Pick<CmsModel, "modelId">;
    children: React.ReactElement;
}

const ContentEntryLocker = ({ children, entry, model }: IContentEntryLockerProps) => {
    const { updateEntryLock, unlockEntry } = useLockingMechanism();

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
            unlockEntry(record);
        };
    }, [entry.id, entry.savedOn]);

    return children;
};

export interface IContentEntryLockCheckProps {
    entry: CmsContentEntry;
    model: Pick<CmsModel, "modelId">;
    children: React.ReactElement;
}

export const ContentEntryLockCheck = (props: IContentEntryLockCheckProps) => {
    const { entry, model, children } = props;
    const {
        loading: lockingMechanismLoading,
        isRecordLocked,
        setRecords,
        records,
        getLockRecordEntry
    } = useLockingMechanism();
    const contentEntriesList = useContentEntriesList();

    useEffect(() => {
        setRecords(contentEntriesList.folderId, model.modelId, contentEntriesList.records);
    }, [entry.id, model.modelId, contentEntriesList.records]);

    const isLocked = useMemo(() => {
        return isRecordLocked({
            id: entry.id,
            $lockingType: model.modelId
        });
    }, [entry.id, model.modelId, lockingMechanismLoading, records]);

    const record = getLockRecordEntry(entry.id);

    if (lockingMechanismLoading || !record) {
        return <div>Loading locking mechanism...</div>;
    } else if (isLocked) {
        return <LockedRecord id={entry.id} />;
    }

    return children;
};

export const HeadlessCmsContentEntry = ContentEntry.createDecorator(Original => {
    return function LockingMechanismContentEntry(props) {
        const { loading, entry, contentModel } = useContentEntry();

        if (loading || !entry.id) {
            return <Original {...props} />;
        }

        return (
            <ContentEntryLockCheck entry={entry} model={contentModel}>
                <ContentEntryLocker entry={entry} model={contentModel}>
                    <Original {...props} />
                </ContentEntryLocker>
            </ContentEntryLockCheck>
        );
    };
});
