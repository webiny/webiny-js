import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismUnlockEntryRequestParams } from "../abstractions/ILockingMechanismUnlockEntryRequest";

export type ILockingMechanismUnlockEntryRequestVariables =
    ILockingMechanismUnlockEntryRequestParams;

export interface ILockingMechanismUnlockEntryRequestResponse {
    lockingMechanism: {
        unlockEntryRequest: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const createUnlockEntryRequestGraphQL = () => {
    return gql`
        mutation LockingMechanismUnlockEntryRequest($id: ID!, $type: String!) {
            lockingMechanism {
                unlockEntryRequest(id: $id, type: $type) {
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
