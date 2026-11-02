// `field` uses the server's vocabulary (R267): "title", "color", "config.teams",
// "config.settings.<path>", "config.instructions", "config.model", ... or "" for a server error that
// names no field.
export interface StepFieldError {
    field: string;
    message: string;
    // The rule a rule-level error belongs to (R288, R299, R303), else null. A rule error's `field` has no index.
    ruleId: string | null;
}

export interface StepValidationErrors {
    stepId: string;
    errors: StepFieldError[];
}

export interface WorkflowDraftErrors {
    name: string | null;
    steps: string | null;
    stepErrors: StepValidationErrors[];
}
