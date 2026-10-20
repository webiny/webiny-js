/**
 * A step type the workflow editor can offer (D130): a row of `listStepTypes`, built from the
 * `StepType` registry (R138).
 */
export interface WorkflowStepTypeInfo {
    /** Stored on `WorkflowStep.type`, e.g. "review". */
    type: string;
    title: string;
    /** Whether a step of this type may be added now. */
    available: boolean;
    /** Why it is unavailable; `null` when available. */
    unavailableReason: string | null;
    /** JSON schema of the step's `config`; `null` when the type has no editable config yet. */
    configSchema: Record<string, unknown> | null;
}

/**
 * An automation a workflow author can add as a step (R138): a row of `listAutomationDefinitions`.
 * `models` is the scope (D35); `settingsSchema` is the JSON schema of what the author fills in.
 */
export interface AutomationDefinitionInfo {
    id: string;
    name: string;
    models: string[];
    settingsSchema: Record<string, unknown>;
}

/**
 * An AI tool a workflow author can allowlist on an AI step (R167): a row of `listAiTools`. No
 * input schema: the editor shows what a tool is, the runner builds what the model sees.
 */
export interface WorkflowAiToolInfo {
    name: string;
    title: string;
    description: string;
    /** True when the tool writes or updates the content under review (R283). */
    changesContent: boolean;
}

/**
 * A user as the workflows configuration screens list one (D48, D104, R286): no email or roles.
 * `teamIds` are the ids of the user's teams, never their names; `[]` for a user with no teams and
 * for every user while teams are off.
 */
export interface WorkflowListedUser {
    id: string;
    displayName: string;
    teamIds: string[];
}

/** The shared user list (R123). `missingIds`: requested ids with no user (D117); `[]` for a search. */
export interface WorkflowUserList {
    users: WorkflowListedUser[];
    missingIds: string[];
}

/**
 * A team as the workflow editor lists one (R268): no slug, description or roles. `memberCount` is
 * the number of admin users in the team, so the editor can warn about a team with no members.
 */
export interface WorkflowTeamSummary {
    id: string;
    name: string;
    memberCount: number;
}

/** The shared team list (R268). `missingIds`: requested ids with no team; `[]` for a search. */
export interface WorkflowTeamList {
    teams: WorkflowTeamSummary[];
    missingIds: string[];
}
