import gql from "graphql-tag";
import { ERROR_FIELDS, LOCK_RECORD_FIELDS } from "./fields";
import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";
import { IRecordLockingUnlockEntryParams } from "../abstractions/IRecordLockingUnlockEntry";

export type IRecordLockingUnlockEntryVariables = IRecordLockingUnlockEntryParams;

export interface RecordLockingUnlockEntryResponse {
    recordLocking: {
        unlockEntry: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

export const UNLOCK_ENTRY_MUTATION = gql`
    mutation RecordLockingUnlockEntry($id: ID!, $type: String!, $force: Boolean) {
        recordLocking {
            unlockEntry(id: $id, type: $type, force: $force) {
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
