import { useContentEntriesList, useContentEntry } from "@webiny/app-headless-cms";
import React, { useEffect, useRef } from "react";
import { useRecordLocking } from "~/hooks";
import { IIsRecordLockedParams, IRecordLockingIdentity, IRecordLockingLockRecord } from "~/types";
import {
    IncomingGenericData,
    IWebsocketsSubscription,
    useWebsockets
} from "@webiny/app-websockets";
import { parseIdentifier } from "@webiny/utils";
import { useDialogs } from "@webiny/app-admin";

export interface IContentEntryLockerProps {
    children: React.ReactElement;
}

export interface IKickOutWebsocketsMessage extends IncomingGenericData {
    data: {
        record: IRecordLockingLockRecord;
        user: IRecordLockingIdentity;
    };
}
interface IForceUnlockedProps {
    user: IRecordLockingIdentity;
}
const ForceUnlocked = ({ user }: IForceUnlockedProps) => {
    return (
        <>
            The entry you were editing was forcefully unlocked by{" "}
            {user.displayName || "Unknown user"}. You will now be redirected back to the list of
            entries.
        </>
    );
};

export const ContentEntryLocker = ({ children }: IContentEntryLockerProps) => {
    const { entry, contentModel: model } = useContentEntry();
    const { updateEntryLock, unlockEntry, fetchLockedEntryLockRecord, removeEntryLock } =
        useRecordLocking();

    const { navigateTo } = useContentEntriesList();

    const subscription = useRef<IWebsocketsSubscription<any>>();

    const websockets = useWebsockets();

    const { showDialog } = useDialogs();

    useEffect(() => {
        if (!entry.id) {
            return;
        } else if (subscription.current) {
            subscription.current.off();
        }
        const { id: entryId } = parseIdentifier(entry.id);

        subscription.current = websockets.onMessage<IKickOutWebsocketsMessage>(
            `recordLocking.entry.kickOut.${entryId}`,
            async incoming => {
                const { user } = incoming.data;
                const record: IIsRecordLockedParams = {
                    id: entryId,
                    $lockingType: model.modelId
                };
                removeEntryLock(record);
                showDialog({
                    title: "Entry was forcefully unlocked",
                    content: <ForceUnlocked user={user} />,
                    acceptLabel: "Ok",
                    onClose: undefined,
                    cancelLabel: undefined
                });
                navigateTo();
            }
        );

        return () => {
            if (!subscription.current) {
                return;
            }
            subscription.current.off();
        };
    }, [entry.id, navigateTo, model.modelId]);

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
                const result = await fetchLockedEntryLockRecord(record);
                if (result) {
                    return;
                }
                unlockEntry(record);
            })();
        };
    }, [entry.id]);

    return children;
};
