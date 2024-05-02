import { WebinyError } from "@webiny/error";
import { useContext } from "react";
import { RecordLockingContext } from "~/components/RecordLockingProvider";
import { IRecordLockingContext, IPossiblyRecordLockingRecord } from "~/types";

export const useRecordLocking = <
    T extends IPossiblyRecordLockingRecord = IPossiblyRecordLockingRecord
>() => {
    const context = useContext(RecordLockingContext);
    if (!context) {
        throw new WebinyError("useRecordLocking must be used within a RecordLockingProvider.");
    }
    return context as IRecordLockingContext<T>;
};
