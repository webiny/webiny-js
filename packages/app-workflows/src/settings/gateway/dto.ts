// `WorkflowsExclusion` as selected, and `WorkflowsExclusionInput` as sent (R317).
export interface WorkflowExclusionDto {
    userId: string;
    reason: string | null;
    // The `DateTime` string as the server returned it, or the ISO UTC string sent.
    endsOn: string | null;
}

// `WorkflowsSettings` as selected, and `WorkflowsSettingsInput` as sent.
export interface WorkflowSettingsDto {
    exclusions: WorkflowExclusionDto[];
}
