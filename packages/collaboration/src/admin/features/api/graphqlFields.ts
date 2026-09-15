export const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

export const IDENTITY_FIELDS = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

export const MESSAGE_FIELDS = /* GraphQL */ `
    {
        id
        body
        mentions
        createdBy ${IDENTITY_FIELDS}
        createdOn
        deleted
        deletedBy ${IDENTITY_FIELDS}
        deletedOn
    }
`;

export const THREAD_FIELDS = /* GraphQL */ `
    {
        id
        contentType
        contentId
        locator
        type
        resolved
        resolvedBy ${IDENTITY_FIELDS}
        resolvedOn
        assigneeId
        dueDate
        createdBy ${IDENTITY_FIELDS}
        createdOn
        messages ${MESSAGE_FIELDS}
        anchor {
            exists
            authorized
            label
            path
        }
    }
`;
