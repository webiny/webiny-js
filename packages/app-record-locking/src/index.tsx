import React from "react";
import { Provider } from "@webiny/app";
import { RecordLockingProvider as RecordLockingProviderComponent } from "~/components/RecordLockingProvider";
import { HeadlessCmsActionsAcoCell } from "~/components/HeadlessCmsActionsAcoCell";
import { HeadlessCmsContentEntry } from "~/components/HeadlessCmsContentEntry";
import { useWcp } from "@webiny/app-wcp";

export * from "~/components/RecordLockingProvider";
export * from "~/hooks";

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
    const { canUseRecordLocking } = useWcp();

    if (!canUseRecordLocking()) {
        return null;
    }

    return (
        <>
            <Provider hoc={RecordLockingHoc} />
            <HeadlessCmsActionsAcoCell />
            <HeadlessCmsContentEntry />
        </>
    );
};
