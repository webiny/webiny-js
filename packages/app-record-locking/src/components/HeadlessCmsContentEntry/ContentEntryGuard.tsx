import React, { useEffect, useState } from "react";
import { useRecordLocking } from "~/hooks/index.js";
import { LockedRecord } from "../LockedRecord/index.js";
import type { IRecordLockingLockRecord } from "~/types.js";
import type { CmsContentEntry, CmsModel } from "@webiny/app-headless-cms/types.js";
import { OverlayLoader } from "@webiny/admin-ui";

export interface IContentEntryGuardProps {
    loading: boolean;
    entry: CmsContentEntry;
    model: CmsModel;
    children: React.ReactElement;
}

export const ContentEntryGuard = (props: IContentEntryGuardProps) => {
    const { loading, entry, model, children } = props;
    const { fetchLockedEntryLockRecord } = useRecordLocking();

    const [locked, setLocked] = useState<IRecordLockingLockRecord | null | undefined>(undefined);

    useEffect(() => {
        if (!entry.id || loading || locked !== undefined) {
            return;
        }
        (async () => {
            const result = await fetchLockedEntryLockRecord({
                id: entry.id,
                $lockingType: model.modelId
            });
            setLocked(result);
        })();
    }, [entry.id, loading]);

    if (locked === undefined) {
        return (
            <div className={"h-screen w-screen fixed top-0 left-0 z-20"}>
                <OverlayLoader text={"Checking record status..."} />
            </div>
        );
    } else if (locked) {
        return <LockedRecord record={locked} />;
    }

    return children;
};
