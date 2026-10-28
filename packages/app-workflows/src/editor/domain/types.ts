import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
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
    // A short line on what the model suits, when the API offers one.
    description?: string;
}

export interface AiTool {
    // What an AI step stores in its tool allowlist.
    name: string;
    // What the editor shows: the plain name and one sentence. The model-facing text never reaches the admin.
    label: string;
    summary: string;
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

// The conditions of a rule the editor can show; a failed `modelId` condition names none (R289).
export type RoutingCondition = "requesterUser" | "requesterTeam" | "folder";

// `notEvaluated`: a rule after the deciding one, never looked at (R289).
export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped" | "notEvaluated";

export type RoutingSource = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool";

export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    // The server's skip reason for `skipped`, as it is; `null` otherwise or when it has none.
    reason: string | null;
    // Non-empty only for `notMatched`, in the order the server evaluated them.
    failedConditions: RoutingCondition[];
}

// A person routing skipped (D118). `displayName` is `null` outside the step's teams.
export interface RoutingSkippedPerson {
    userId: string;
    displayName: string | null;
    reason: string;
}

export interface RoutingOwner {
    id: string;
    displayName: string;
}

// What routing would do with an unsaved step config (R121, D45, D118). No load numbers (D104).
export interface RoutingInspection {
    owner: RoutingOwner | null;
    source: RoutingSource;
    ruleId: string | null;
    // The step's configured strategy.
    strategy: AssignmentStrategy;
    // The team a matched team-target rule narrowed to, else `null`.
    narrowedTeamId: string | null;
    // The first candidate ids in the order the strategy considers them (at most three).
    candidateIds: string[];
    // All candidates, so the editor can say `and others`.
    candidateCount: number;
    // Every rule in order.
    trace: RoutingTraceEntry[];
    skipped: RoutingSkippedPerson[];
}

// The step config the inspector evaluates: exactly what `toStepInput` emits for a People step.
export interface RoutingStepConfig {
    teams: string[];
    assignment: Record<string, unknown>;
}
