import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorActor } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorActorDto } from "~/editor/gateway/dto.js";
import type { EditorStepDto } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";

// `savedOn` is a string the server compares as it is (D131): fixtures use a millisecond ISO value.
export const EDITOR_CREATED_ON = "2026-10-17T08:00:00.000Z";
export const EDITOR_SAVED_ON = "2026-10-18T09:15:30.123Z";

const PEOPLE_CONFIG = {
    teams: ["team-1"],
    assignment: { strategy: "none", allowManualPick: false, rules: [] }
};

export const createEditorActor = (overrides: Partial<EditorActor> = {}): EditorActor => {
    return { id: "user-1", displayName: "Ada Lovelace", ...overrides };
};

export const createEditorActorDto = (overrides: Partial<EditorActorDto> = {}): EditorActorDto => {
    return { id: "user-1", displayName: "Ada Lovelace", ...overrides };
};

export const createEditorStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "var(--color-primary-500)",
        description: null,
        type: "review",
        notificationIds: ["e-mail"],
        config: PEOPLE_CONFIG,
        ...overrides
    };
};

export const createEditorStepDto = (overrides: Partial<EditorStepDto> = {}): EditorStepDto => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "var(--color-primary-500)",
        description: null,
        type: "review",
        notifications: [{ id: "e-mail" }],
        config: PEOPLE_CONFIG,
        ...overrides
    };
};

export const createEditorWorkflow = (overrides: Partial<EditorWorkflow> = {}): EditorWorkflow => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: ["cms.article"],
        steps: [createEditorStep()],
        createdOn: EDITOR_CREATED_ON,
        savedOn: EDITOR_SAVED_ON,
        createdBy: createEditorActor(),
        savedBy: createEditorActor({ id: "user-2", displayName: "Grace Hopper" }),
        ...overrides
    };
};

export const createEditorWorkflowDto = (
    overrides: Partial<EditorWorkflowDto> = {}
): EditorWorkflowDto => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: ["cms.article"],
        steps: [createEditorStepDto()],
        createdOn: EDITOR_CREATED_ON,
        savedOn: EDITOR_SAVED_ON,
        createdBy: createEditorActorDto(),
        savedBy: createEditorActorDto({ id: "user-2", displayName: "Grace Hopper" }),
        ...overrides
    };
};

export const createEditorStepType = (overrides: Partial<EditorStepType> = {}): EditorStepType => {
    return {
        type: "review",
        title: "Review",
        available: true,
        unavailableReason: null,
        configSchema: null,
        ...overrides
    };
};

export const createEditorStepTypeDto = (
    overrides: Partial<EditorStepTypeDto> = {}
): EditorStepTypeDto => {
    return {
        type: "review",
        title: "Review",
        available: true,
        unavailableReason: null,
        configSchema: null,
        ...overrides
    };
};

export const createAutomationDefinition = (
    overrides: Partial<AutomationDefinition> = {}
): AutomationDefinition => {
    return {
        id: "automation-1",
        name: "Check links",
        models: ["*"],
        settingsSchema: null,
        ...overrides
    };
};

export const createAutomationDefinitionDto = (
    overrides: Partial<AutomationDefinitionDto> = {}
): AutomationDefinitionDto => {
    return {
        id: "automation-1",
        name: "Check links",
        models: ["*"],
        settingsSchema: null,
        ...overrides
    };
};

export const createNotificationTransport = (
    overrides: Partial<NotificationTransport> = {}
): NotificationTransport => {
    return { id: "e-mail", title: "E-mail", description: null, ...overrides };
};

export const createWorkflowTeamSummary = (
    overrides: Partial<WorkflowTeamSummary> = {}
): WorkflowTeamSummary => {
    return { id: "team-1", name: "Editors", memberCount: 3, ...overrides };
};

export const createWorkflowUserSummary = (
    overrides: Partial<WorkflowUserSummary> = {}
): WorkflowUserSummary => {
    return { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"], ...overrides };
};

export const createWorkflowUserDto = (
    overrides: Partial<WorkflowUserDto> = {}
): WorkflowUserDto => {
    return { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"], ...overrides };
};

export const createWorkflowUserListDto = (
    overrides: Partial<WorkflowUserListDto> = {}
): WorkflowUserListDto => {
    return { users: [createWorkflowUserDto()], missingIds: [], ...overrides };
};

export const createRoutingInspectionDto = (
    overrides: Partial<RoutingInspectionDto> = {}
): RoutingInspectionDto => {
    return {
        owner: { id: "user-2", displayName: "Ivan Horvat" },
        source: "rule",
        ruleId: "rule-1",
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
        skipped: [],
        ...overrides
    };
};

export const createRoutingInspection = (
    overrides: Partial<RoutingInspection> = {}
): RoutingInspection => {
    return {
        owner: { id: "user-2", displayName: "Ivan Horvat" },
        source: "rule",
        ruleId: "rule-1",
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
        skipped: [],
        ...overrides
    };
};

export const createAppFolder = (overrides: Partial<AppFolder> = {}): AppFolder => {
    return { id: "folder-1", path: "/Campaigns", ...overrides };
};

export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
    return {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        providerId: "openai",
        providerName: "OpenAI",
        ...overrides
    };
};

export const createAiTool = (overrides: Partial<AiTool> = {}): AiTool => {
    return {
        name: "readContent",
        title: "Read content",
        description: "Reads the content under review.",
        changesContent: false,
        ...overrides
    };
};

export const createAiToolDto = (overrides: Partial<AiToolDto> = {}): AiToolDto => {
    return {
        name: "readContent",
        title: "Read content",
        description: "Reads the content under review.",
        changesContent: false,
        ...overrides
    };
};

export const createWorkflowModelRow = (
    overrides: Partial<WorkflowModelRow> = {}
): WorkflowModelRow => {
    return {
        model: "cms.article",
        modelId: "article",
        name: "Article",
        workflow: { id: "workflow-1", name: "Article review" },
        ...overrides
    };
};

export const createWorkflowModelRowDto = (
    overrides: Partial<WorkflowModelRowDto> = {}
): WorkflowModelRowDto => {
    return {
        model: "cms.article",
        modelId: "article",
        name: "Article",
        workflow: { id: "workflow-1", name: "Article review" },
        ...overrides
    };
};

export const createWorkflowModelPage = (
    overrides: Partial<WorkflowModelPage> = {}
): WorkflowModelPage => {
    return {
        rows: [createWorkflowModelRow()],
        cursor: null,
        hasMoreItems: false,
        ...overrides
    };
};

export const createWorkflowModelPageDto = (
    overrides: Partial<WorkflowModelPageDto> = {}
): WorkflowModelPageDto => {
    return {
        rows: [createWorkflowModelRowDto()],
        meta: { cursor: null, hasMoreItems: false },
        ...overrides
    };
};
