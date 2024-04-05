export const LOCK_RECORD_FIELDS = /* GraphQL */ `
    id
    lockedBy {
        id
        displayName
        type
    }
    lockedOn
    targetId
    type
    actions {
        type
        message
        createdBy {
            id
            displayName
            type
        }
        createdOn
    }
`;

export const ERROR_FIELDS = /* GraphQL */ `
    message
    code
    data
`;
