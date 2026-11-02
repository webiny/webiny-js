export interface WorkflowExclusion {
    userId: string;
    reason?: string;
    /** ISO datetime in UTC (D43, D110). */
    endsOn?: string;
}

/** Tenant workflow settings (spec 4.4, D16). */
export interface WorkflowSettings {
    exclusions: WorkflowExclusion[];
}
