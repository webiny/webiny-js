import { IHeadlessCmsLockRecord } from "~/lockingMechanism/types";
import { CmsError } from "~tests/contentAPI/aco/setup/graphql/contentEntry";

export const LOCK_RECORD = /* GraphQL */ `
    id
    targetId
    type
    lockedBy {
        id
        displayName
        type
    }
    lockedOn
    actions {
        type
        createdOn
        createdBy {
            id
            displayName
            type
        }
        message
    }
`;

export interface IIsEntryLockedGraphQlVariables {
    id: string;
    type: string;
}

export interface IIsEntryLockedGraphQlResponse {
    lockingMechanism: {
        isEntryLocked: {
            data?: boolean;
            error?: CmsError;
        };
    };
}

export const IS_ENTRY_LOCKED_QUERY = /* GraphQL */ `
    query IsEntryLocked($id: ID!, $type: String!) {
        lockingMechanism {
            isEntryLocked(id: $id, type: $type) {
                data
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

export interface IGetLockRecordGraphQlVariables {
    id: string;
}

export interface IGetLockRecordGraphQlResponse {
    lockingMechanism: {
        getLockRecord: {
            data?: IHeadlessCmsLockRecord;
            error?: CmsError;
        };
    };
}

export const GET_LOCK_RECORD_QUERY = /* GraphQL */ `
    query GetLockRecord($id: ID!) {
        lockingMechanism {
            getLockRecord(id: $id) {
                data {
                    ${LOCK_RECORD}
                }
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

export interface ILockEntryGraphQlVariables {
    id: string;
    type: string;
}

export interface ILockEntryGraphQlResponse {
    lockingMechanism: {
        lockEntry: {
            data?: IHeadlessCmsLockRecord;
            error?: CmsError;
        };
    };
}

export const LOCK_ENTRY_MUTATION = /* GraphQL */ `
    mutation LockEntry($id: ID!, $type: String!) {
        lockingMechanism {
            lockEntry(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

export interface IUnlockEntryGraphQlVariables {
    id: string;
    type: string;
}

export interface IUnlockEntryGraphQlResponse {
    lockingMechanism: {
        unlockEntry: {
            data?: boolean;
            error?: CmsError;
        };
    };
}

export const UNLOCK_ENTRY_MUTATION = /* GraphQL */ `
    mutation UnlockEntry($id: ID!, $type: String!) {
        lockingMechanism {
            unlockEntry(id: $id, type: $type) {
                data
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

export interface IUnlockEntryRequestGraphQlVariables {
    id: string;
    type: string;
}

export interface IUnlockEntryRequestGraphQlResponse {
    lockingMechanism: {
        unlockEntryRequest: {
            data?: IHeadlessCmsLockRecord;
            error?: CmsError;
        };
    };
}

export const UNLOCK_ENTRY_REQUEST_MUTATION = /* GraphQL */ `
    mutation UnlockEntryRequest($id: ID!, $type: String!) {
        lockingMechanism {
            unlockEntryRequest(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;
