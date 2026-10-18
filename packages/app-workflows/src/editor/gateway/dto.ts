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

export interface AiToolDto {
    name: string;
    title: string;
    description: string;
    changesContent: boolean;
}

/*
 * The response of one operation under the shared `workflows` root: the root field name maps to the
 * envelope the config gateway returns.
 */
export interface WorkflowsOperationResponse<TName extends string, TEnvelope> {
    workflows: Record<TName, TEnvelope>;
}
