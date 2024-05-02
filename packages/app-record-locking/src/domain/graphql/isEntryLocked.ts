import gql from "graphql-tag";
import { ERROR_FIELDS } from "~/domain/graphql/fields";
import { IRecordLockingError } from "~/types";
import { IRecordLockingIsEntryLockedParams } from "../abstractions/IRecordLockingIsEntryLocked";

export type IRecordLockingIsEntryLockedVariables = IRecordLockingIsEntryLockedParams;

export interface IRecordLockingIsEntryLockedResponse {
    recordLocking: {
        isEntryLocked: {
            data: boolean | null;
            error: IRecordLockingError | null;
        };
    };
}

export const IS_ENTRY_LOCKED_QUERY = gql`
    query RecordLockingIsEntryLocked($id: ID!, $type: String!) {
        recordLocking {
            isEntryLocked(id: $id, type: $type) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
