import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";

export interface EditorActor {
    id: string;
    displayName: string;
}

export interface EditorStep {
    id: string;
    title: string;
    color: string;
    description: string | null;
    // The step type id: `review`, `automation`, `ai` or a type this admin does not know.
    type: string;
    // The ids of the notification transports; ids no transport lists any more are kept (R272).
    notificationIds: string[];
    // The step config as the server stores it; the step forms narrow it per type.
    config: unknown;
}

export interface EditorWorkflow {
    id: string;
    name: string;
    // The bound namespaces (`cms.<modelId>`, `wb.page`).
    models: string[];
    steps: EditorStep[];
    createdOn: string;
    // The string the server compares on save (D131): kept exactly as read.
    savedOn: string;
    createdBy: EditorActor;
    savedBy: EditorActor;
}

export interface EditorStepNotificationInput {
    id: string;
}

export interface EditorStepInput {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    notifications: EditorStepNotificationInput[];
    config: unknown;
}

// What `storeWorkflow` sends: the `WorkflowsWorkflowInput` of the server.
export interface EditorWorkflowInput {
    id: string;
    name: string;
    models: string[];
    steps: EditorStepInput[];
}

export interface EditorStepType {
    type: string;
    title: string;
    available: boolean;
    unavailableReason: string | null;
    configSchema: JsonSchema | null;
}

export interface AutomationDefinition {
    id: string;
    name: string;
    // Where it may be used: `*`, `<app>.*` or exact namespace ids (D35).
    models: string[];
    settingsSchema: JsonSchema | null;
}

export interface NotificationTransport {
    id: string;
    title: string;
    description: string | null;
}

export interface WorkflowTeamSummary {
    id: string;
    name: string;
    memberCount: number;
}

export interface WorkflowTeamList {
    teams: WorkflowTeamSummary[];
    missingIds: string[];
}

// A user as the editor lists one (D104): id, display name and the ids of the user's teams, no more.
export interface WorkflowUserSummary {
    id: string;
    displayName: string;
    // `[]` when the user has no team and always `[]` while teams are off (R286).
    teamIds: string[];
}

export interface WorkflowUserList {
    users: WorkflowUserSummary[];
    // The requested ids that no user has any more (D117).
    missingIds: string[];
}

export interface AiModel {
    // `<providerId>/<modelId>`: what an AI step stores as its model.
    id: string;
    name: string;
    providerId: string;
    providerName: string;
}

export interface AiTool {
    // What an AI step stores in its tool allowlist.
    name: string;
    title: string;
    description: string;
    // True when the tool can change the content under review (R283); the AI step summary says so.
    changesContent: boolean;
}

export interface WorkflowModelRowWorkflow {
    id: string;
    name: string;
}

// One entry of the editor's model list. The WB list has the single row `wb.page`.
export interface WorkflowModelRow {
    // The namespace id a workflow binds: `cms.<modelId>`, `wb.page`.
    model: string;
    modelId: string;
    name: string;
    // The workflow bound to the model, `null` when it has none.
    workflow: WorkflowModelRowWorkflow | null;
}

export interface WorkflowModelPage {
    rows: WorkflowModelRow[];
    cursor: string | null;
    hasMoreItems: boolean;
}
