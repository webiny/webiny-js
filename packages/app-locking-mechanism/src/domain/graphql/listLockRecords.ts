import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "~/domain/graphql/fields";
import {
    ILockingMechanismError,
    ILockingMechanismLockRecord,
    ILockingMechanismMeta
} from "~/types";
import { ILockingMechanismListLockRecordsParams } from "~/domain/abstractions/ILockingMechanismListLockRecords";

export interface ILockingMechanismListLockedRecordsVariablesWhere {
    id_in?: string[];
}

export type ILockingMechanismListLockedRecordsVariables = ILockingMechanismListLockRecordsParams;

export interface ILockingMechanismListLockedRecordsResponse {
    lockingMechanism: {
        listLockRecords: {
            data: ILockingMechanismLockRecord[] | null;
            error: ILockingMechanismError | null;
            meta: ILockingMechanismMeta | null;
        };
    };
}

export const createListLockRecords = () => {
    return gql`
        query LockingMechanismListLockedRecords(
            $where: LockingMechanismListWhereInput
            $sort: [LockingMechanismListSorter!]
            $limit: Int
            $after: String
        ) {
            lockingMechanism {
                listLockRecords(where: $where, sort: $sort, limit: $limit, after: $after) {
                    data {
                        ${LOCK_RECORD_FIELDS}
                    }
                    error {
                        ${ERROR_FIELDS}
                    }
                }
            }
        }
    `;
};

export const LIST_LOCK_RECORDS = createListLockRecords();
