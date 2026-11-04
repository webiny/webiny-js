// The codes `GraphQLOperationError.code` carries for the editor's operations (R204, R276, R278).
export const WorkflowErrorCode = {
    NotFound: "Workflows/Workflow/NotFound",
    Conflict: "Workflows/Workflow/Conflict",
    Validation: "Workflows/Workflow/Validation",
    Persistence: "Workflows/Workflow/Persistence",
    HasActiveReviews: "Workflows/Workflow/HasActiveReviews",
    NotAuthorized: "Workflows/NotAuthorized"
} as const;
