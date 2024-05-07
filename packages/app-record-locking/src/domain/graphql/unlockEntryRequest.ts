import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";
import { IRecordLockingUnlockEntryRequestParams } from "../abstractions/IRecordLockingUnlockEntryRequest";

export type IRecordLockingUnlockEntryRequestVariables = IRecordLockingUnlockEntryRequestParams;

export interface IRecordLockingUnlockEntryRequestResponse {
    recordLocking: {
        unlockEntryRequest: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

export const createUnlockEntryRequestGraphQL = () => {
    return gql`
        mutation RecordLockingUnlockEntryRequest($id: ID!, $type: String!) {
            recordLocking {
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
