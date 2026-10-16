export const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    app
    name
    steps {
        id
        title
        color
        description
        teams {
            id
        }
        notifications {
            id
        }
    }
`;
