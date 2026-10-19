/*
 * One person taken out of automatic assignment (spec 4.4, D105): one entry per user. `reason` is
 * shown only to people with Manage workflows or Reassign and operate; `endsOn` is the stored ISO
 * UTC instant the exclusion ends at (D43, D124), `null` for "until removed". An absent and a
 * `null` value from the server are both `null` here (R317).
 */
export interface WorkflowExclusion {
    userId: string;
    reason: string | null;
    endsOn: string | null;
}

// The tenant's workflow settings record; a save replaces it whole (D106).
export interface WorkflowSettings {
    exclusions: WorkflowExclusion[];
}
