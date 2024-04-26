import { useContentEntriesList, useContentEntry } from "@webiny/app-headless-cms";
import React, { useEffect, useRef } from "react";
import { useLockingMechanism } from "~/hooks";
import { IIsRecordLockedParams } from "~/types";
import { IWebsocketsSubscription, useWebsockets } from "@webiny/app-websockets";
import { parseIdentifier } from "@webiny/utils";
import { useDialogs } from "@webiny/app-admin";

export interface IContentEntryLockerProps {
    children: React.ReactElement;
}

export const ContentEntryLocker = ({ children }: IContentEntryLockerProps) => {
    const { entry, contentModel: model } = useContentEntry();
    const { updateEntryLock, unlockEntry, fetchLockedEntryLockRecord } = useLockingMechanism();

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

        subscription.current = websockets.onMessage(
            `lockingMechanism.entry.kickOut.${entryId}`,
            async () => {
                showDialog({
                    title: "Forceful unlock of the entry",
                    content: `The entry you were editing was forcefully unlocked.`,
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
    }, [entry.id, navigateTo]);

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
