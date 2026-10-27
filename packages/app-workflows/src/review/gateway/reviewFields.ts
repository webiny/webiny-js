const ACTOR_FIELDS = /* GraphQL */ `
    type
    id
    displayName
    identityType
`;

export const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const REVIEW_FIELDS = /* GraphQL */ `
    id
    workflowId
    model
    targetId
    targetRevisionId
    title
    isActive
    state
    currentStepId
    currentStepState
    currentStepType
    currentOwnerId
    currentCandidateTeamIds
    targetContext {
        folder {
            id
            type
        }
        modelId
        title
        author {
            id
            displayName
        }
    }
    workflow {
        name
        models
    }
    steps {
        id
        title
        color
        description
        type
        state
        owner {
            ${ACTOR_FIELDS}
        }
        comment
        pickedUserId
        candidateTeamIds
        candidateTeams {
            id
            name
        }
        assignmentSource
        assignment {
            source
            ruleId
            reason
            by {
                ${ACTOR_FIELDS}
            }
        }
        reachedOn
        startedOn
        finishedOn
        taskId
        runs {
            taskId
            startedOn
            finishedOn
            outcome
            reason
        }
        issues {
            fieldPath
            severity
            message
            suggestion
        }
    }
    createdBy {
        ${ACTOR_FIELDS}
    }
    cancelledBy {
        ${ACTOR_FIELDS}
    }
    createdOn
    savedOn
    lastChangedOn
`;

/*
 * The assignment log of each step (D127), single reads only. Add it with
 * `steps { ${REVIEW_ASSIGNMENT_FIELDS} }` next to `REVIEW_FIELDS`: GraphQL merges the two `steps`
 * selections.
 */
export const REVIEW_ASSIGNMENT_FIELDS = /* GraphQL */ `
    assignments {
        id
        kind
        userId
        userDisplayName
        assignedOn
        source
        ruleId
        by {
            ${ACTOR_FIELDS}
        }
        reason
    }
`;

const VIEWER_FLAGS_FIELDS = /* GraphQL */ `
    canStart
    canTakeOver
    canApprove
    canReject
    canCancel
    canReassign
    canRestart
`;

// List-safe: the review and the viewer flags, without the assignment log.
export const REVIEW_WITH_FLAGS_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
    }
    flags {
        ${VIEWER_FLAGS_FIELDS}
    }
`;

// Single reads (`getTargetReview`, `getReview`): the review with the assignment log, and the flags.
export const REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
        steps {
            ${REVIEW_ASSIGNMENT_FIELDS}
        }
    }
    flags {
        ${VIEWER_FLAGS_FIELDS}
    }
`;

export const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    steps {
        id
        title
        color
        description
        type
        config
    }
`;

export const STEP_CANDIDATE_FIELDS = /* GraphQL */ `
    id
    displayName
    excluded
    excludedReason
    teams
`;

// The `WorkflowsStepRunInfo` selection (R257): the only task fields workflows exposes (R146).
export const STEP_RUN_INFO_FIELDS = /* GraphQL */ `
    taskId
    status
    startedOn
    finishedOn
    iterations
    outcome
    reason
`;

// The `WorkflowsBlockingReview` selection of the bulk pre-check (R265).
export const BLOCKING_REVIEW_FIELDS = /* GraphQL */ `
    reviewId
    model
    targetId
    targetRevisionId
    title
    stepPosition
    stepCount
    stepName
`;

// The `meta.system.workflow` selection on content lists (R213), shared by both apps.
export const REVIEW_SYSTEM_WORKFLOW_SELECTION = "workflowId reviewState stepId stepName stepState";
