import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismUnlockEntryParams } from "../abstractions/ILockingMechanismUnlockEntry";

export type ILockingMechanismUnlockEntryVariables = ILockingMechanismUnlockEntryParams;

export interface ILockingMechanismUnlockEntryResponse {
    lockingMechanism: {
        unlockEntry: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const UNLOCK_ENTRY_MUTATION = gql`
    mutation LockingMechanismUnlockEntry($id: ID!, $type: String!) {
        lockingMechanism {
            unlockEntry(id: $id, type: $type) {
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
