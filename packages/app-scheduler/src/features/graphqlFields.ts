export const SCHEDULER_ENTRY_FIELDS = /* GraphQL */ `
    id
    targetId
    namespace
    scheduledBy {
        id
        displayName
        type
    }
    publishOn
    unpublishOn
    actionType
    title
`;

export const ERROR_FIELDS = /* GraphQL */ `
    message
    code
    data
    stack
`;
