import React from "react";
import { ContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useLockingMechanism } from "~/hooks";

export const HeadlessCmsContentEntry = ContentEntry.createDecorator(Original => {
    return function LockingMechanismContentEntry(props) {
        const { loading, entry, contentModel } = useContentEntry();

        const { isRecordLocked, loading: lockingMechanismLoading } = useLockingMechanism();

        if (loading || !entry?.id) {
            return <Original {...props} />;
        } else if (lockingMechanismLoading) {
            return <div>Loading locking mechanism...</div>;
        }
        const record = {
            id: entry.id,
            $lockingType: contentModel.modelId
        };

        if (isRecordLocked(record)) {
            return <div>Record is locked!</div>;
        }

        return <Original {...props} />;
    };
});
