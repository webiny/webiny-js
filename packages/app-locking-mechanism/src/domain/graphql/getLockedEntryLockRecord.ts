import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismGetLockedEntryLockRecordExecuteParams } from "~/domain/abstractions/ILockingMechanismGetLockedEntryLockRecord";

export type ILockingMechanismGetLockedEntryLockRecordVariables =
    ILockingMechanismGetLockedEntryLockRecordExecuteParams;

export interface ILockingMechanismGetLockedEntryLockRecordResponse {
    lockingMechanism: {
        getLockedEntryLockRecord: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const GET_LOCKED_ENTRY_LOCK_RECORD_QUERY = gql`
    query LockingMechanismGetLockedEntryLockRecord($id: ID!, $type: String!) {
        lockingMechanism {
            getLockedEntryLockRecord(id: $id, type: $type) {
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
