// The `WorkflowsWorkflow` selection of the editor: models, steps with notification ids, save stamps.
export const EDITOR_WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    steps {
        id
        title
        color
        description
        type
        notifications {
            id
        }
        config
    }
    createdOn
    savedOn
    createdBy {
        id
        displayName
    }
    savedBy {
        id
        displayName
    }
`;

export const EDITOR_STEP_TYPE_FIELDS = /* GraphQL */ `
    type
    title
    available
    unavailableReason
    configSchema
`;

export const EDITOR_AUTOMATION_DEFINITION_FIELDS = /* GraphQL */ `
    id
    name
    models
    settingsSchema
`;

export const EDITOR_NOTIFICATION_TRANSPORT_FIELDS = /* GraphQL */ `
    id
    title
    description
`;

// The `WorkflowsTeamListResult` selection (R268): id, name and member count only.
export const EDITOR_TEAM_LIST_FIELDS = /* GraphQL */ `
    teams {
        id
        name
        memberCount
    }
    missingIds
`;

// The `WorkflowsUserListResult` selection (R286): id, display name and team ids only (D104).
export const EDITOR_USER_LIST_FIELDS = /* GraphQL */ `
    users {
        id
        displayName
        teamIds
    }
    missingIds
`;

// The `WorkflowsRoutingInspection` selection (R289), shared by both apps' inspectRouting documents.
export const EDITOR_ROUTING_INSPECTION_FIELDS = /* GraphQL */ `
    owner {
        id
        displayName
    }
    source
    ruleId
    strategy
    narrowedTeamId
    candidateIds
    candidateCount
    trace {
        ruleId
        outcome
        reason
        failedConditions
    }
    skipped {
        userId
        displayName
        reason
    }
`;

export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
    id
    name
    providerId
    providerName
`;

export const EDITOR_AI_TOOL_FIELDS = /* GraphQL */ `
    name
    label
    summary
    changesContent
`;
