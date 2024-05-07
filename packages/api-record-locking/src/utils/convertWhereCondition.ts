import { IRecordLockingListLockRecordsParams } from "~/types";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";

type IWhere = IRecordLockingListLockRecordsParams["where"] | undefined;

const attachPrefix = (value: string | string[] | undefined) => {
    if (!value) {
        return value;
    } else if (Array.isArray(value)) {
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
            const value = where[key] as IWhere[] | undefined;
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
        const newKey = key.replace("id", "entryId");
        where[newKey] = attachPrefix(where[key] as string | string[] | undefined);
        delete where[key];
    }
    return where;
};
