import gql from "graphql-tag";
import { ERROR_FIELDS } from "~/domain/graphql/fields";
import { ILockingMechanismError } from "~/types";
import { ILockingMechanismIsEntryLockedParams } from "../abstractions/ILockingMechanismIsEntryLocked";

export type ILockingMechanismIsEntryLockedVariables = ILockingMechanismIsEntryLockedParams;

export interface ILockingMechanismIsEntryLockedResponse {
    lockingMechanism: {
        isEntryLocked: {
            data: boolean | null;
            error: ILockingMechanismError | null;
        };
    };
}

export const createIsEntryLockedGraphQL = () => {
    return gql`
        mutation LockingMechanismIsEntryLocked($id: ID!, $type: String!) {
            lockingMechanism {
                isEntryLocked(id: $id, type: $type) {
                    data
                    error {
                        ${ERROR_FIELDS}
                    }
                }
            }
        }
    `;
};
