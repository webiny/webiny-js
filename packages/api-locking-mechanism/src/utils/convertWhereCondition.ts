import { ILockingMechanismListLockRecordsParams } from "~/types";

type IWhere = ILockingMechanismListLockRecordsParams["where"] | undefined;

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
        where[newKey] = where[key];
        delete where[key];
    }
    return where;
};
