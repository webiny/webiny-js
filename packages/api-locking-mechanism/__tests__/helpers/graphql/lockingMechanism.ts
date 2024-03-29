import { ILockingMechanismLockRecord } from "~/types";
import { CmsError } from "@webiny/api-headless-cms/types";

export const LOCK_ERROR = /* GraphQL */ `
    error {
        message
        code
        data
    }
    `;

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
                ${LOCK_ERROR}
            }
        }
    }
`;

export interface IListLockRecordsGraphQlVariables {
    limit?: number;
    after?: string;
    sort?: string[];
    where?: Record<string, any>;
}

export interface IListLockRecordsGraphQlResponse {
    lockingMechanism: {
        listLockRecords: {
            data?: ILockingMechanismLockRecord[];
            error?: CmsError;
        };
    };
}

export const LIST_LOCK_RECORDS_QUERY = /* GraphQL */ `
    query ListLockRecords {
        lockingMechanism {
            listLockRecords {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
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
            data?: ILockingMechanismLockRecord;
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
                ${LOCK_ERROR}
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
            data?: ILockingMechanismLockRecord;
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
                ${LOCK_ERROR}
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
            data?: ILockingMechanismLockRecord;
            error?: CmsError;
        };
    };
}

export const UNLOCK_ENTRY_MUTATION = /* GraphQL */ `
    mutation UnlockEntry($id: ID!, $type: String!) {
        lockingMechanism {
            unlockEntry(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
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
            data?: ILockingMechanismLockRecord;
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
                ${LOCK_ERROR}
            }
        }
    }
`;
