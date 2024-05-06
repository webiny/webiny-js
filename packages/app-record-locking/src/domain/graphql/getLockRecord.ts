import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";
import { IRecordLockingGetLockRecordExecuteParams } from "~/domain/abstractions/IRecordLockingGetLockRecord";

export type IRecordLockingGetLockRecordVariables = IRecordLockingGetLockRecordExecuteParams;

export interface IRecordLockingGetLockRecordResponse {
    recordLocking: {
        getLockRecord: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

export const GET_LOCK_RECORD_QUERY = gql`
    query RecordLockingGetLockRecord($id: ID!) {
        recordLocking {
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
