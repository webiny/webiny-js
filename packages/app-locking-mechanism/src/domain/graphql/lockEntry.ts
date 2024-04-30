import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismLockEntryParams } from "~/domain/abstractions/ILockingMechanismLockEntry";

export type ILockingMechanismLockEntryVariables = ILockingMechanismLockEntryParams;

export interface ILockingMechanismLockEntryResponse {
    lockingMechanism: {
        lockEntry: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const createLockGraphQL = () => {
    return gql`
        mutation LockingMechanismLockEntry($id: ID!, $type: String!) {
            lockingMechanism {
                lockEntry(id: $id, type: $type) {
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
