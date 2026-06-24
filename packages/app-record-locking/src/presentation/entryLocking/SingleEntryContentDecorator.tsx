import React from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useRouter } from "@webiny/app";
import { useDialogs } from "@webiny/app-admin";
import { useWebsockets } from "@webiny/app-websockets";
import { OverlayLoader } from "@webiny/admin-ui";
import { parseIdentifier } from "@webiny/utils";
import { SingleEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/SingleEntryFormContent.js";
import { SingleEntryPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/singleEntry/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { RecordLockingPresenter } from "./abstractions.js";
import { LockedEntryOverlay } from "./components/LockedEntryOverlay.js";
import type { IKickOutData } from "./abstractions.js";
import type { IncomingGenericData } from "@webiny/app-websockets";

interface KickOutMessage extends IncomingGenericData {
    data: IKickOutData;
}

export const SingleEntryContentDecorator = SingleEntryFormContent.createDecorator(Original => {
    return observer(function RecordLockingSingleEntryContent(props) {
        const container = useContainer();
        const websockets = useWebsockets();
        const router = useRouter();
        const { showDialog } = useDialogs();

        const singleEntryPresenter = React.useMemo(
            () => container.resolve(SingleEntryPresenter),
            [container]
        );

        const lockingPresenter = React.useMemo(
            () => container.resolve(RecordLockingPresenter),
            [container]
        );

        const modelAccessor = React.useMemo(() => container.resolve(CmsModelContext), [container]);

        const entry = singleEntryPresenter.vm.entry;

        React.useEffect(() => {
            if (!entry?.id) {
                return;
            }
            lockingPresenter.init(entry.id, modelAccessor.getModel().modelId);
            return () => lockingPresenter.dispose();
        }, [entry?.id]);

        React.useEffect(() => {
            if (!entry?.id) {
                return;
            }
            const { id } = parseIdentifier(entry.id);
            const sub = websockets.onMessage<KickOutMessage>(
                `recordLocking.entry.kickOut.${id}`,
                incoming => lockingPresenter.handleKickOut(incoming.data)
            );
            return () => {
                sub.off();
            };
        }, [entry?.id]);

        React.useEffect(() => {
            if (lockingPresenter.vm.status !== "kicked-out") {
                return;
            }

            router.unblockTransition();
            showDialog({
                title: "Entry was forcefully unlocked!",
                content: (
                    <>
                        The entry you were editing was forcefully unlocked by{" "}
                        <strong>
                            {lockingPresenter.vm.lockRecord?.lockedBy?.displayName ||
                                "Unknown user"}
                        </strong>
                        . Unfortunately, this means you lost the unsaved changes.
                    </>
                ),
                acceptLabel: "Ok",
                onClose: undefined,
                cancelLabel: null
            });
        }, [lockingPresenter.vm.status]);

        if (!entry?.id) {
            return <Original {...props} />;
        }

        if (lockingPresenter.vm.status === "checking") {
            return <OverlayLoader text={"Checking record status..."} />;
        }

        if (lockingPresenter.vm.status === "locked") {
            return (
                <LockedEntryOverlay
                    vm={lockingPresenter.vm}
                    entryTitle={entry.meta?.title}
                    onForceUnlock={() => lockingPresenter.forceUnlock()}
                    onNavigateBack={() => {
                        // It's a single-entry model, so there's nowhere to go.
                    }}
                />
            );
        }

        return <Original {...props} />;
    });
});
