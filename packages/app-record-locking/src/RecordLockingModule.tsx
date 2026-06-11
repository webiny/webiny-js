import React from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useRouter } from "@webiny/app";
import { useWebsockets } from "@webiny/app-websockets";
import { useDialogs } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { parseIdentifier } from "@webiny/utils";
import { Content } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { RecordLockingPresenter } from "~/presentation/entryLocking/abstractions.js";
import { LockedEntryOverlay } from "~/presentation/entryLocking/components/LockedEntryOverlay.js";
import { RecordLockingCellActionsDecorator } from "~/presentation/listLocking/components/LockIndicatorCell.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import type { IKickOutData } from "~/presentation/entryLocking/abstractions.js";
import type { IncomingGenericData } from "@webiny/app-websockets";

interface KickOutMessage extends IncomingGenericData {
    data: IKickOutData;
}

const ContentDecorator = Content.createDecorator(Original => {
    return observer(function RecordLockingContent(props) {
        const container = useContainer();
        const formPresenter = useContentEntryFormPresenter();
        const websockets = useWebsockets();
        const router = useRouter();
        const { showDialog } = useDialogs();

        const presenter = React.useMemo(
            () => container.resolve(RecordLockingPresenter),
            [container]
        );

        const entry = formPresenter.vm.entry;
        const model = formPresenter.vm.model;

        React.useEffect(() => {
            if (!entry?.id) {
                return;
            }
            presenter.init(entry.id, model.modelId);
            return () => presenter.dispose();
        }, [entry?.id, model.modelId]);

        React.useEffect(() => {
            if (!entry?.id) {
                return;
            }
            const { id } = parseIdentifier(entry.id);
            const sub = websockets.onMessage<KickOutMessage>(
                `recordLocking.entry.kickOut.${id}`,
                incoming => presenter.handleKickOut(incoming.data)
            );
            return () => {
                sub.off();
            };
        }, [entry?.id, model.modelId]);

        React.useEffect(() => {
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
        }, [presenter.vm.status]);

        if (!entry?.id) {
            return <Original {...props} />;
        }

        if (presenter.vm.status === "checking") {
            return (
                <div className={"h-screen w-screen fixed top-0 left-0 z-20"}>
                    <OverlayLoader text={"Checking record status..."} />
                </div>
            );
        }

        if (presenter.vm.status === "locked") {
            return (
                <LockedEntryOverlay
                    vm={presenter.vm}
                    entryTitle={entry.meta?.title}
                    onForceUnlock={() => presenter.forceUnlock()}
                    onNavigateBack={() => router.goBack()}
                />
            );
        }

        return <Original {...props} />;
    });
});

export const RecordLockingModule = () => {
    return (
        <>
            <ContentDecorator />
            <RecordLockingCellActionsDecorator />
        </>
    );
};
