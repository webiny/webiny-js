import { CmsEntry } from "~/types";
import { IHeadlessCmsLockRecord, IHeadlessCmsLockRecordValues } from "~/lockingMechanism/types";

export const convertEntryToLockRecord = (
    entry: CmsEntry<IHeadlessCmsLockRecordValues>
): IHeadlessCmsLockRecord => {
    return {
        id: entry.entryId,
        targetId: entry.values["targetId"],
        type: entry.values["type"],
        lockedBy: entry.savedBy,
        lockedOn: new Date(entry.createdOn)
    };
};
