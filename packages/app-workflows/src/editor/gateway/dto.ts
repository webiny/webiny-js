export interface EditorActorDto {
    id: string;
    displayName: string;
}

export interface EditorStepNotificationDto {
    id: string;
}

export interface EditorStepDto {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    notifications: EditorStepNotificationDto[];
    // JSON of any shape.
    config: unknown;
}

export interface EditorWorkflowDto {
    id: string;
    name: string;
    models: string[];
    steps: EditorStepDto[];
    createdOn: string;
    // The `DateTime!` string as the server returned it (D131).
    savedOn: string;
    createdBy: EditorActorDto;
    savedBy: EditorActorDto;
}

export interface EditorErrorDto {
    code: string | null;
    message: string | null;
    data: unknown;
}

export interface EditorEnvelope<T> {
    data: T | null;
    error: EditorErrorDto | null;
}

export interface EditorListMetaDto {
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface WorkflowModelRowWorkflowDto {
    id: string;
    name: string;
    stepCount: number;
}

export interface WorkflowModelRowDto {
    model: string;
    modelId: string;
    name: string;
    workflow: WorkflowModelRowWorkflowDto | null;
}

// A list answer folded into one `data`: the rows and the page meta (R280).
export interface WorkflowModelPageDto {
    rows: WorkflowModelRowDto[];
    meta: EditorListMetaDto;
}

export interface EditorStepTypeDto {
    type: string;
    title: string;
    available: boolean;
    unavailableReason: string | null;
    // JSON schema of the step config; `null` when the type has none.
    configSchema: unknown;
}

export interface AutomationDefinitionDto {
    id: string;
    name: string;
    models: string[];
    // JSON schema of the settings; `null` when the automation has none.
    settingsSchema: unknown;
}

export interface WorkflowUserDto {
    id: string;
    displayName: string;
    teamIds: string[];
}

export interface WorkflowUserListDto {
    users: WorkflowUserDto[];
    missingIds: string[];
}

export interface AiToolDto {
    name: string;
    label: string;
    summary: string;
    changesContent: boolean;
}

export type RoutingConditionDto = "requesterUser" | "requesterTeam" | "folder";

export type RoutingTraceOutcomeDto = "matched" | "notMatched" | "skipped" | "notEvaluated";

export type RoutingSourceDto = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool";

export interface RoutingTraceEntryDto {
    ruleId: string;
    outcome: RoutingTraceOutcomeDto;
    reason: string | null;
    failedConditions: RoutingConditionDto[];
}

export interface RoutingSkippedPersonDto {
    userId: string;
    displayName: string | null;
    reason: string;
}

export interface RoutingInspectionDto {
    owner: EditorActorDto | null;
    source: RoutingSourceDto;
    ruleId: string | null;
    // `String!` in the schema; the mapper narrows it to the three strategies.
    strategy: string;
    narrowedTeamId: string | null;
    candidateIds: string[];
    candidateCount: number;
    trace: RoutingTraceEntryDto[];
    skipped: RoutingSkippedPersonDto[];
}

/*
 * The response of one operation under the shared `workflows` root: the root field name maps to the
 * envelope the config gateway returns.
 */
export interface WorkflowsOperationResponse<TName extends string, TEnvelope> {
    workflows: Record<TName, TEnvelope>;
}
