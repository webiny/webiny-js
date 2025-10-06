import React from "react";
import { Provider } from "@webiny/app";
import { RecordLockingProvider as RecordLockingProviderComponent } from "~/components/RecordLockingProvider.js";
import { HeadlessCmsActionsAcoCell } from "~/components/HeadlessCmsActionsAcoCell.js";
import { HeadlessCmsContentEntry } from "~/components/HeadlessCmsContentEntry/index.js";
import { useWcp } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { recordLockingPermissionRenderer } from "~/components/permissionRenderer/index.js";

export * from "~/components/RecordLockingProvider.js";
export * from "~/hooks/index.js";

export interface RecordLockingProviderProps {
    children: React.ReactNode;
}

const RecordLockingHoc = (Component: React.ComponentType<RecordLockingProviderProps>) => {
    return function RecordLockingProvider({ children }: RecordLockingProviderProps) {
        return (
            <Component>
                <RecordLockingProviderComponent>{children}</RecordLockingProviderComponent>
            </Component>
        );
    };
};

export const RecordLocking = () => {
    const wcp = useWcp();

    if (!wcp.canUseRecordLocking()) {
        return null;
    }
    plugins.register(recordLockingPermissionRenderer);

    return (
        <>
            <Provider hoc={RecordLockingHoc} />
            <HeadlessCmsActionsAcoCell />
            <HeadlessCmsContentEntry />
        </>
    );
};
