import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismUpdateEntryLockExecuteParams } from "~/domain/abstractions/ILockingMechanismUpdateEntryLock";

export type ILockingMechanismUpdateEntryLockVariables =
    ILockingMechanismUpdateEntryLockExecuteParams;

export interface ILockingMechanismUpdateEntryLockResponse {
    lockingMechanism: {
        updateEntryLock: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const UPDATE_ENTRY_LOCK = gql`
    mutation LockingMechanismUpdateEntryLock($id: ID!, $type: String!) {
        lockingMechanism {
            updateEntryLock(id: $id, type: $type) {
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
