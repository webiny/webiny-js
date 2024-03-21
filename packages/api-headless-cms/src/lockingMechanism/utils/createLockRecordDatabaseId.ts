import { IHeadlessCmsLockRecordEntryType } from "~/lockingMechanism/types";

export interface CreateLockRecordIdParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

const re = /^([a-zA-Z0-9_-]+)#([a-zA-Z0-9_-]+)$/;
const validateType = (type: string) => {
    if (re.test(type)) {
        return;
    }
    throw new Error(`Invalid type "${type}" for the Lock Record ID.`);
};

export const createLockRecordDatabaseId = (params: CreateLockRecordIdParams): string => {
    validateType(params.type);
    return `${params.type}#${params.id}`;
};
