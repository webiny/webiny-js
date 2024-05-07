import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";
import { IRecordLockingUpdateEntryLockExecuteParams } from "~/domain/abstractions/IRecordLockingUpdateEntryLock";

export type IRecordLockingUpdateEntryLockVariables = IRecordLockingUpdateEntryLockExecuteParams;

export interface IRecordLockingUpdateEntryLockResponse {
    recordLocking: {
        updateEntryLock: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

export const UPDATE_ENTRY_LOCK = gql`
    mutation RecordLockingUpdateEntryLock($id: ID!, $type: String!) {
        recordLocking {
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
