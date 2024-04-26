import { WebinyError } from "@webiny/error";
import { useContext } from "react";
import { LockingMechanismContext } from "~/components/LockingMechanismProvider";
import { ILockingMechanismContext, IPossiblyLockingMechanismRecord } from "~/types";

export const useLockingMechanism = <
    T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord
>() => {
    const context = useContext(LockingMechanismContext);
    if (!context) {
        throw new WebinyError("useLockingMechanism must be used within a LockingMechanismProvider");
    }
    return context as ILockingMechanismContext<T>;
};
