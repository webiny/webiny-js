import React from "react";
import { useRouter } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import { Routes } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { LockedEntryOverlay } from "./LockedEntryOverlay.js";
import type { IRecordLockingViewModel } from "../abstractions.js";

interface LockStatusViewProps {
    vm: IRecordLockingViewModel;
    isSingleton: boolean;
    entryTitle?: string;
    onForceUnlock: () => Promise<boolean>;
    children: React.ReactNode;
}

/**
 * Singleton models are edited in place inside the admin layout, so their lock UI must not
 * cover the whole screen, and there is no previous entry list to go back to.
 */
export const LockStatusView = ({
    vm,
    isSingleton,
    entryTitle,
    onForceUnlock,
    children
}: LockStatusViewProps) => {
    const router = useRouter();

    const onNavigateBack = () => {
        if (isSingleton) {
            router.goToRoute(Routes.ContentModels.List);
            return;
        }
        router.goBack();
    };

    if (vm.status === "checking") {
        const loader = <OverlayLoader text={"Checking record status..."} />;

        if (isSingleton) {
            return <div className={"relative h-full w-full"}>{loader}</div>;
        }

        return <div className={"h-screen w-screen fixed top-0 left-0 z-20"}>{loader}</div>;
    }

    if (vm.status === "locked") {
        const overlay = (
            <LockedEntryOverlay
                vm={vm}
                entryTitle={entryTitle}
                onForceUnlock={onForceUnlock}
                onNavigateBack={onNavigateBack}
            />
        );

        if (isSingleton) {
            return <div className={"relative h-full w-full"}>{overlay}</div>;
        }

        return overlay;
    }

    return <>{children}</>;
};
