import type { IRecordLockingListLockRecordsParams } from "~/types.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";

type IWhere = IRecordLockingListLockRecordsParams["where"] | undefined;

const attachPrefix = (value: string | string[]) => {
    if (Array.isArray(value)) {
        return value.map(createLockRecordDatabaseId);
    }
    return createLockRecordDatabaseId(value);
};

export const convertWhereCondition = (where: IWhere): IWhere => {
    if (!where) {
        return where;
    }
    for (const key in where) {
        if (key.startsWith("AND") || key.startsWith("OR")) {
            const value = where[key as keyof typeof where] as IWhere[] | undefined;
            if (!value) {
                continue;
            }
            for (const subKey in value) {
                value[subKey] = convertWhereCondition(value[subKey]);
            }
            continue;
        } else if (key.startsWith("id") === false) {
            continue;
        }
        const value = where[key as keyof typeof where];
        if (!value) {
            continue;
        }

        const newKey = key.replace("id", "entryId") as keyof typeof where;
        // @ts-expect-error
        where[newKey] = attachPrefix(where[key]);
        // @ts-expect-error
        delete where[key];
    }
    return where;
};
