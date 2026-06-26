export const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const META_FIELDS = /* GraphQL */ `
    totalCount
    hasMoreItems
    cursor
`;

export const WORKFLOW_STATE_STEP_FIELDS = /* GraphQL */ `
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
    comment
    savedBy {
        id
        displayName
        type
    }
    state
    canReview
    canTakeOver
    isOwner
`;

export const WORKFLOW_STATE_FIELDS = /* GraphQL */ `
    id
    isActive
    app
    title
    targetId
    targetRevisionId
    comment
    state
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    savedBy {
        id
        displayName
        type
    }
    steps {
        ${WORKFLOW_STATE_STEP_FIELDS}
    }
    previousStep {
        ${WORKFLOW_STATE_STEP_FIELDS}
    }
    nextStep {
        ${WORKFLOW_STATE_STEP_FIELDS}
    }
    currentStep {
        ${WORKFLOW_STATE_STEP_FIELDS}
    }
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
