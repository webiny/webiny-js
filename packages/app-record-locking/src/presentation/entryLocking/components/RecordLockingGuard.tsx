import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useRouter } from "@webiny/app";
import { useDialogs } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { useWebsockets } from "@webiny/app-websockets";
import { parseIdentifier } from "@webiny/utils";
import { RecordLockingPresenter } from "../abstractions.js";
import { LockedEntryOverlay } from "./LockedEntryOverlay.js";
import type { IKickOutData } from "../abstractions.js";
import type { IncomingGenericData } from "@webiny/app-websockets";

interface KickOutMessage extends IncomingGenericData {
    data: IKickOutData;
}

interface RecordLockingGuardProps {
    entryId: string;
    modelId: string;
    entryTitle?: string;
    onNavigateBack: () => void;
    children: React.ReactNode;
}

export const RecordLockingGuard = observer(
    ({ entryId, modelId, entryTitle, onNavigateBack, children }: RecordLockingGuardProps) => {
        const container = useContainer();
        const presenter = React.useMemo(
            () => container.resolve(RecordLockingPresenter),
            [container]
        );
        const websockets = useWebsockets();
        const router = useRouter();
        const { showDialog } = useDialogs();

        useEffect(() => {
            presenter.init(entryId, modelId);

            return () => {
                presenter.dispose();
            };
        }, [entryId, modelId]);

        useEffect(() => {
            const { id } = parseIdentifier(entryId);

            const sub = websockets.onMessage<KickOutMessage>(
                `recordLocking.entry.kickOut.${id}`,
                incoming => {
                    presenter.handleKickOut(incoming.data);
                }
            );

            return () => {
                sub.off();
            };
        }, [entryId, modelId]);

        useEffect(() => {
            if (presenter.vm.status !== "kicked-out") {
                return;
            }

            router.unblockTransition();

            showDialog({
                title: "Entry was forcefully unlocked!",
                content: (
                    <>
                        The entry you were editing was forcefully unlocked by{" "}
                        <strong>
                            {presenter.vm.lockRecord?.lockedBy?.displayName || "Unknown user"}
                        </strong>
                        . Unfortunately, this means you lost the unsaved changes.
                    </>
                ),
                acceptLabel: "Ok",
                onClose: undefined,
                cancelLabel: null
            });

            onNavigateBack();
        }, [presenter.vm.status]);

        const { vm } = presenter;

        if (vm.status === "checking") {
            return (
                <div className={"h-screen w-screen fixed top-0 left-0 z-20"}>
                    <OverlayLoader text={"Checking record status..."} />
                </div>
            );
        }

        if (vm.status === "locked") {
            return (
                <LockedEntryOverlay
                    vm={vm}
                    entryTitle={entryTitle}
                    onForceUnlock={() => presenter.forceUnlock()}
                    onNavigateBack={onNavigateBack}
                />
            );
        }

        if (vm.status === "error") {
            return (
                <div className={"h-screen w-screen fixed top-0 left-0 z-20"}>
                    <OverlayLoader text={"Failed to check record lock status."} />
                </div>
            );
        }

        return <>{children}</>;
    }
);
