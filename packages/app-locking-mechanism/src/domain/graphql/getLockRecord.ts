import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";
import { ILockingMechanismGetLockRecordParams } from "~/domain/abstractions/ILockingMechanismGetLockRecord";

export type ILockingMechanismGetLockRecordVariables = ILockingMechanismGetLockRecordParams;

export interface ILockingMechanismGetLockRecordResponse {
    lockingMechanism: {
        getLockRecord: {
            data: ILockingMechanismLockRecord | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const getLockRecordGraphQL = () => {
    return gql`
        query LockingMechanismGetLockRecord($id: ID!) {
            lockingMechanism {
                getLockRecord(id: $id) {
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
