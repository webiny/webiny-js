import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";
import { IRecordLockingLockEntryParams } from "~/domain/abstractions/IRecordLockingLockEntry";

export type IRecordLockingLockEntryVariables = IRecordLockingLockEntryParams;

export interface IRecordLockingLockEntryResponse {
    recordLocking: {
        lockEntry: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

export const createLockGraphQL = () => {
    return gql`
        mutation RecordLockingLockEntry($id: ID!, $type: String!) {
            recordLocking {
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
