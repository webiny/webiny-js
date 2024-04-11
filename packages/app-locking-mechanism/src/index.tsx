import React from "react";
import { Provider } from "@webiny/app";
import { LockingMechanismProvider as LockingMechanismProviderComponent } from "~/components/LockingMechanismProvider";
import { HeadlessCmsAcoCell } from "~/components/HeadlessCmsAcoCell";
import { HeadlessCmsContentEntry } from "~/components/HeadlessCmsContentEntry";
import { useWcp } from "@webiny/app-wcp";

export * from "~/components/LockingMechanismProvider";
export * from "~/hooks";

export interface LockingMechanismProviderProps {
    children: React.ReactNode;
}

const LockingMechanismHoc = (Component: React.ComponentType) => {
    return function LockingMechanismProvider({ children }: LockingMechanismProviderProps) {
        const { canUseRecordLocking } = useWcp();
        if (!canUseRecordLocking()) {
            return <Component>{children}</Component>;
        }
        return (
            <Component>
                <LockingMechanismProviderComponent>
                    {children}
                    <HeadlessCmsAcoCell />
                    <HeadlessCmsContentEntry />
                </LockingMechanismProviderComponent>
            </Component>
        );
    };
};

const LockingMechanismExtension = () => {
    return (
        <>
            <Provider hoc={LockingMechanismHoc} />
        </>
    );
};

export const LockingMechanism = React.memo(LockingMechanismExtension);
