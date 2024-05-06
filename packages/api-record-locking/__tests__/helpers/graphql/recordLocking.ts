import { IRecordLockingLockRecord } from "~/types";
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
    updatedOn
    expiresOn
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
    recordLocking: {
        isEntryLocked: {
            data?: boolean;
            error?: CmsError;
        };
    };
}

export const IS_ENTRY_LOCKED_QUERY = /* GraphQL */ `
    query IsEntryLocked($id: ID!, $type: String!) {
        recordLocking {
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
    recordLocking: {
        listLockRecords: {
            data?: IRecordLockingLockRecord[];
            error?: CmsError;
        };
    };
}

export const LIST_LOCK_RECORDS_QUERY = /* GraphQL */ `
    query ListLockRecords {
        recordLocking {
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
    type: string;
}

export interface IGetLockRecordGraphQlResponse {
    recordLocking: {
        getLockRecord: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export const GET_LOCK_RECORD_QUERY = /* GraphQL */ `
    query GetLockRecord($id: ID!, $type: String!) {
        recordLocking {
            getLockRecord(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
            }
        }
    }
`;

export interface IGetLockedEntryLockRecordGraphQlVariables {
    id: string;
    type: string;
}

export interface IGetLockedEntryLockRecordGraphQlResponse {
    recordLocking: {
        getLockRecord: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export const GET_LOCKED_ENTRY_LOCK_RECORD_QUERY = /* GraphQL */ `
    query GetLockedEntryLockRecord($id: ID!, $type: String!) {
        recordLocking {
            getLockedEntryLockRecord(id: $id, type: $type) {
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
    recordLocking: {
        lockEntry: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export const LOCK_ENTRY_MUTATION = /* GraphQL */ `
    mutation LockEntry($id: ID!, $type: String!) {
        recordLocking {
            lockEntry(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
            }
        }
    }
`;

export interface IUpdateEntryLockGraphQlVariables {
    id: string;
    type: string;
}

export interface IUpdateEntryLockGraphQlResponse {
    recordLocking: {
        updateEntryLock: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export interface IUnlockEntryGraphQlVariables {
    id: string;
    type: string;
}

export const UPDATE_ENTRY_LOCK_MUTATION = /* GraphQL */ `
    mutation UpdateEntryLock($id: ID!, $type: String!) {
        recordLocking {
            updateEntryLock(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
            }
        }
    }
`;

export interface IUnlockEntryGraphQlResponse {
    recordLocking: {
        unlockEntry: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export const UNLOCK_ENTRY_MUTATION = /* GraphQL */ `
    mutation UnlockEntry($id: ID!, $type: String!) {
        recordLocking {
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
    recordLocking: {
        unlockEntryRequest: {
            data?: IRecordLockingLockRecord;
            error?: CmsError;
        };
    };
}

export const UNLOCK_ENTRY_REQUEST_MUTATION = /* GraphQL */ `
    mutation UnlockEntryRequest($id: ID!, $type: String!) {
        recordLocking {
            unlockEntryRequest(id: $id, type: $type) {
                data {
                    ${LOCK_RECORD}
                }
                ${LOCK_ERROR}
            }
        }
    }
`;
