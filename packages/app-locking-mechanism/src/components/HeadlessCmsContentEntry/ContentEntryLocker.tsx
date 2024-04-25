import { useContentEntriesList, useContentEntry } from "@webiny/app-headless-cms";
import React, { useEffect, useRef } from "react";
import { useLockingMechanism } from "~/hooks";
import { IIsRecordLockedParams } from "~/types";
import { IWebsocketsSubscription, useWebsockets } from "@webiny/app-websockets";
import { parseIdentifier } from "@webiny/utils";

export interface IContentEntryLockerProps {
    children: React.ReactElement;
}

export const ContentEntryLocker = ({ children }: IContentEntryLockerProps) => {
    const { entry, contentModel: model } = useContentEntry();
    const { updateEntryLock, unlockEntry, fetchIsEntryLocked } = useLockingMechanism();

    const { navigateTo } = useContentEntriesList();

    const subscription = useRef<IWebsocketsSubscription<any>>();

    const websockets = useWebsockets();

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
