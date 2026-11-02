### Task 5: Editor domain, DTOs, GraphQL selections, mappers and fixtures

R204, R243, R268, R276 (error codes and data), R280 (model rows and page); Q42; Review Focus 1. The pure part of the editor core, in `packages/app-workflows/src/editor`: the domain types, the workflow error codes, the DTOs, the GraphQL selections, the mappers and the R243 pure fixtures. No DI, no mobx, no vitest outside the tests. Tasks 5b and 5c build the gateways, use cases, toasts and the feature on it.

Behaviour:

- **Mapping keeps `savedOn` and `createdOn` as the exact strings** the `DateTime!` fields return. The editor sends the loaded `savedOn` back unchanged and the server compares strings (D131). Nothing here parses, formats or rounds them (Review Focus 1).
- **Step types and automation definitions:** `configSchema` and `settingsSchema` arrive as untyped JSON; `toJsonSchema` keeps an object and turns anything else (null, absent, a string, an array) into `null`. Absent optional fields (`description`, `unavailableReason`, `workflow`, `cursor`) become `null`.
- **Model page:** the server answers a list with `data` and `meta`; the gateways (Task 7) fold them into `WorkflowModelPageDto { rows, meta }`, and `mapWorkflowModelPage` maps that to `WorkflowModelPage { rows, cursor, hasMoreItems }` (R280).
- **Error codes:** `WorkflowErrorCode` pins the server strings the presenters switch on (R276, R278).
- **Precondition:** `JsonSchema` is the type of Task 3 (9a.2). Build it first: `yarn build -p @webiny/app-admin` after Task 3 so that `dist` carries the `.d.ts`, because the `yarn build -p @webiny/app-workflows` of Step 5 type-checks against it.

**Files:** (all under `packages/app-workflows/src/editor`)
- Create: `domain/types.ts`
- Create: `domain/WorkflowErrorCode.ts`, `domain/WorkflowErrorCode.test.ts`
- Create: `gateway/dto.ts`
- Create: `gateway/editorFields.ts`, `gateway/editorFields.test.ts`
- Create: `gateway/toJsonSchema.ts`, `gateway/toJsonSchema.test.ts`
- Create: `gateway/mapEditorWorkflow.ts`, `gateway/mapEditorWorkflow.test.ts`
- Create: `gateway/mapEditorStepType.ts`, `gateway/mapEditorStepType.test.ts`
- Create: `gateway/mapAutomationDefinition.ts`, `gateway/mapAutomationDefinition.test.ts`
- Create: `gateway/mapWorkflowModelPage.ts`, `gateway/mapWorkflowModelPage.test.ts`
- Create: `gateway/mapAiTool.ts`, `gateway/mapAiTool.test.ts`
- Create: `testing/editorFixtures.ts`

**Interfaces:**
- Consumes: `JsonSchema` (Task 3, `@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js`).
- Produces (names are the contract's, the field lists are this task's):
  - Domain (`domain/types.ts`): `EditorActor { id; displayName }`; `EditorStep { id; title; color; description: string | null; type: string; notificationIds: string[]; config: unknown }`; `EditorWorkflow { id; name; models: string[]; steps: EditorStep[]; createdOn: string; savedOn: string; createdBy: EditorActor; savedBy: EditorActor }`; `EditorStepNotificationInput { id }`, `EditorStepInput { id; title; color; description: string | null; type; notifications: EditorStepNotificationInput[]; config: unknown }`, `EditorWorkflowInput { id; name; models: string[]; steps: EditorStepInput[] }`; `EditorStepType { type; title; available: boolean; unavailableReason: string | null; configSchema: JsonSchema | null }`; `AutomationDefinition { id; name; models: string[]; settingsSchema: JsonSchema | null }`; `NotificationTransport { id; title; description: string | null }`; `WorkflowTeamSummary { id; name; memberCount: number }`; `WorkflowTeamList { teams; missingIds: string[] }`; `AiModel { id; name; providerId; providerName }`; `AiTool { name; title; description; changesContent: boolean }`; `WorkflowModelRowWorkflow { id; name }`; `WorkflowModelRow { model; modelId; name; workflow: WorkflowModelRowWorkflow | null }`; `WorkflowModelPage { rows; cursor: string | null; hasMoreItems: boolean }`.
  - `WorkflowErrorCode` (`NotFound`, `Conflict`, `Validation`, `Persistence`, `HasActiveReviews`, `NotAuthorized`).
  - `dto.ts`: `EditorActorDto`, `EditorStepDto`, `EditorWorkflowDto`, `EditorErrorDto`, `EditorEnvelope<T>`, `EditorListMetaDto`, `WorkflowModelRowDto`, `WorkflowModelPageDto`, `EditorStepTypeDto`, `AutomationDefinitionDto`, `AiToolDto`, `WorkflowsOperationResponse`.
  - `editorFields.ts`: `EDITOR_WORKFLOW_FIELDS`, `EDITOR_STEP_TYPE_FIELDS`, `EDITOR_AUTOMATION_DEFINITION_FIELDS`, `EDITOR_NOTIFICATION_TRANSPORT_FIELDS`, `EDITOR_TEAM_LIST_FIELDS`, `EDITOR_AI_MODEL_FIELDS`, `EDITOR_AI_TOOL_FIELDS`.
  - Mappers: `mapEditorWorkflow`, `mapEditorStepType`, `mapAutomationDefinition`, `mapWorkflowModelPage`, `mapAiTool`, `toJsonSchema`.
  - `testing/editorFixtures.ts` (pure, R243): `createEditorActor`, `createEditorActorDto`, `createEditorStep`, `createEditorStepDto`, `createEditorWorkflow`, `createEditorWorkflowDto`, `createEditorStepType`, `createEditorStepTypeDto`, `createAutomationDefinition`, `createAutomationDefinitionDto`, `createNotificationTransport`, `createWorkflowTeamSummary`, `createAiModel`, `createAiTool`, `createAiToolDto`, `createWorkflowModelRow`, `createWorkflowModelRowDto`, `createWorkflowModelPage`, `createWorkflowModelPageDto`, `EDITOR_CREATED_ON`, `EDITOR_SAVED_ON`.

**Test runner note:** admin package, `yarn test <path>` only. One named import per line, deep `~/` paths.

- [ ] **Step 1: Write the failing tests**

Create the pure fixtures first (they are source, not tests, and every test below imports them). `packages/app-workflows/src/editor/testing/editorFixtures.ts`:

```ts
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorActor } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorActorDto } from "~/editor/gateway/dto.js";
import type { EditorStepDto } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "~/editor/gateway/dto.js";

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
```

Create `packages/app-workflows/src/editor/domain/WorkflowErrorCode.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { WorkflowErrorCode } from "./WorkflowErrorCode.js";

describe("WorkflowErrorCode", () => {
    it("pins every code to the server's string", () => {
        expect(WorkflowErrorCode).toEqual({
            NotFound: "Workflows/Workflow/NotFound",
            Conflict: "Workflows/Workflow/Conflict",
            Validation: "Workflows/Workflow/Validation",
            Persistence: "Workflows/Workflow/Persistence",
            HasActiveReviews: "Workflows/Workflow/HasActiveReviews",
            NotAuthorized: "Workflows/NotAuthorized"
        });
    });
});
```

Create `packages/app-workflows/src/editor/gateway/editorFields.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EDITOR_AI_MODEL_FIELDS } from "./editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "./editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "./editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "./editorFields.js";

const isBalanced = (selection: string): boolean => {
    let depth = 0;
    for (const char of selection) {
        if (char === "{") {
            depth++;
        }
        if (char === "}") {
            depth--;
        }
        if (depth < 0) {
            return false;
        }
    }
    return depth === 0;
};

const words = (selection: string): string[] => {
    return selection.split(/\s+/).filter(Boolean);
};

describe("editorFields", () => {
    it("keeps every selection balanced", () => {
        const selections = [
            EDITOR_WORKFLOW_FIELDS,
            EDITOR_STEP_TYPE_FIELDS,
            EDITOR_AUTOMATION_DEFINITION_FIELDS,
            EDITOR_NOTIFICATION_TRANSPORT_FIELDS,
            EDITOR_TEAM_LIST_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
            EDITOR_AI_TOOL_FIELDS
        ];

        for (const selection of selections) {
            expect(isBalanced(selection)).toBe(true);
        }
    });

    it("selects the workflow with its models, steps, notification ids and the save stamps (D131)", () => {
        const selection = words(EDITOR_WORKFLOW_FIELDS);

        expect(selection).toContain("models");
        expect(selection).toContain("createdOn");
        expect(selection).toContain("savedOn");
        expect(selection).toContain("config");
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/notifications\s*\{\s*id\s*\}/);
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/createdBy\s*\{\s*id\s+displayName\s*\}/);
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/savedBy\s*\{\s*id\s+displayName\s*\}/);
    });

    it("selects the step type, automation, transport, AI model and AI tool fields the mappers read", () => {
        expect(words(EDITOR_STEP_TYPE_FIELDS)).toEqual([
            "type",
            "title",
            "available",
            "unavailableReason",
            "configSchema"
        ]);
        expect(words(EDITOR_AUTOMATION_DEFINITION_FIELDS)).toEqual([
            "id",
            "name",
            "models",
            "settingsSchema"
        ]);
        expect(words(EDITOR_NOTIFICATION_TRANSPORT_FIELDS)).toEqual(["id", "title", "description"]);
        expect(words(EDITOR_AI_MODEL_FIELDS)).toEqual(["id", "name", "providerId", "providerName"]);
        expect(words(EDITOR_AI_TOOL_FIELDS)).toEqual([
            "name",
            "title",
            "description",
            "changesContent"
        ]);
    });

    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
        expect(EDITOR_TEAM_LIST_FIELDS).toMatch(/teams\s*\{\s*id\s+name\s+memberCount\s*\}/);
        expect(words(EDITOR_TEAM_LIST_FIELDS)).toContain("missingIds");
    });
});
```

Create `packages/app-workflows/src/editor/gateway/toJsonSchema.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toJsonSchema } from "./toJsonSchema.js";

describe("toJsonSchema", () => {
    it("keeps an object schema as it is", () => {
        const schema = { type: "object", properties: { name: { type: "string" } } };

        expect(toJsonSchema(schema)).toBe(schema);
    });

    it("answers null for null and undefined", () => {
        expect(toJsonSchema(null)).toBeNull();
        expect(toJsonSchema(undefined)).toBeNull();
    });

    it("answers null for a value that is not an object schema", () => {
        expect(toJsonSchema("object")).toBeNull();
        expect(toJsonSchema(12)).toBeNull();
        expect(toJsonSchema(true)).toBeNull();
        expect(toJsonSchema([{ type: "object" }])).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/gateway/mapEditorWorkflow.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapEditorWorkflow } from "./mapEditorWorkflow.js";
import { EDITOR_CREATED_ON } from "~/editor/testing/editorFixtures.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorActorDto } from "~/editor/testing/editorFixtures.js";
import { createEditorStepDto } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";

describe("mapEditorWorkflow", () => {
    it("maps every field of a workflow", () => {
        const dto = createEditorWorkflowDto({
            id: "workflow-7",
            name: "Page review",
            models: ["wb.page"],
            steps: [
                createEditorStepDto({
                    id: "step-a",
                    title: "Legal",
                    color: "#3B6FD4",
                    description: "Check the claims.",
                    type: "review",
                    notifications: [{ id: "e-mail" }, { id: "slack" }],
                    config: { teams: ["team-9"] }
                })
            ],
            createdBy: createEditorActorDto({ id: "user-5", displayName: "Maja Kos" }),
            savedBy: createEditorActorDto({ id: "user-6", displayName: "Luka Peric" })
        });

        const workflow = mapEditorWorkflow(dto);

        expect(workflow).toEqual({
            id: "workflow-7",
            name: "Page review",
            models: ["wb.page"],
            steps: [
                {
                    id: "step-a",
                    title: "Legal",
                    color: "#3B6FD4",
                    description: "Check the claims.",
                    type: "review",
                    notificationIds: ["e-mail", "slack"],
                    config: { teams: ["team-9"] }
                }
            ],
            createdOn: EDITOR_CREATED_ON,
            savedOn: EDITOR_SAVED_ON,
            createdBy: { id: "user-5", displayName: "Maja Kos" },
            savedBy: { id: "user-6", displayName: "Luka Peric" }
        });
    });

    it("keeps savedOn and createdOn as the identical strings (D131, Review Focus 1)", () => {
        const dto = createEditorWorkflowDto({
            createdOn: "2026-10-17T08:00:00.000Z",
            savedOn: "2026-10-18T09:15:30.123Z"
        });

        const workflow = mapEditorWorkflow(dto);

        expect(workflow.savedOn).toBe("2026-10-18T09:15:30.123Z");
        expect(workflow.createdOn).toBe("2026-10-17T08:00:00.000Z");
        expect(typeof workflow.savedOn).toBe("string");
    });

    it("keeps a savedOn string without milliseconds untouched", () => {
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30Z" });

        expect(mapEditorWorkflow(dto).savedOn).toBe("2026-10-18T09:15:30Z");
    });

    it("maps a missing description to null", () => {
        const step = createEditorStepDto();
        Reflect.deleteProperty(step, "description");
        const dto = createEditorWorkflowDto({ steps: [step] });

        expect(mapEditorWorkflow(dto).steps[0].description).toBeNull();
    });

    it("maps a step without notifications to an empty id list", () => {
        const dto = createEditorWorkflowDto({
            steps: [createEditorStepDto({ notifications: [] })]
        });

        expect(mapEditorWorkflow(dto).steps[0].notificationIds).toEqual([]);
    });

    it("keeps a step of an unknown type and a config of any shape as they are", () => {
        const config = { anything: [1, { nested: true }], other: null };
        const dto = createEditorWorkflowDto({
            steps: [createEditorStepDto({ type: "future", config })]
        });

        const step = mapEditorWorkflow(dto).steps[0];

        expect(step.type).toBe("future");
        expect(step.config).toBe(config);
    });

    it("keeps the order of the steps and an empty workflow", () => {
        const dto = createEditorWorkflowDto({
            steps: [
                createEditorStepDto({ id: "step-2" }),
                createEditorStepDto({ id: "step-1" }),
                createEditorStepDto({ id: "step-3" })
            ]
        });

        expect(mapEditorWorkflow(dto).steps.map(step => step.id)).toEqual([
            "step-2",
            "step-1",
            "step-3"
        ]);
        expect(mapEditorWorkflow(createEditorWorkflowDto({ steps: [] })).steps).toEqual([]);
    });

    it("does not change the DTO", () => {
        const dto = createEditorWorkflowDto();
        const before = JSON.stringify(dto);

        mapEditorWorkflow(dto);

        expect(JSON.stringify(dto)).toBe(before);
    });
});
```

Create `packages/app-workflows/src/editor/gateway/mapEditorStepType.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapEditorStepType } from "./mapEditorStepType.js";
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";

describe("mapEditorStepType", () => {
    it("maps an available type with its config schema", () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        const dto = createEditorStepTypeDto({
            type: "review",
            title: "Review",
            configSchema
        });

        expect(mapEditorStepType(dto)).toEqual({
            type: "review",
            title: "Review",
            available: true,
            unavailableReason: null,
            configSchema
        });
    });

    it("keeps the reason of an unavailable type", () => {
        const dto = createEditorStepTypeDto({
            type: "ai",
            title: "AI",
            available: false,
            unavailableReason: "Requires the AI Power-Ups licence."
        });

        const stepType = mapEditorStepType(dto);

        expect(stepType.available).toBe(false);
        expect(stepType.unavailableReason).toBe("Requires the AI Power-Ups licence.");
        expect(stepType.configSchema).toBeNull();
    });

    it("maps an absent reason and an absent schema to null", () => {
        const dto = createEditorStepTypeDto();
        Reflect.deleteProperty(dto, "unavailableReason");
        Reflect.deleteProperty(dto, "configSchema");

        const stepType = mapEditorStepType(dto);

        expect(stepType.unavailableReason).toBeNull();
        expect(stepType.configSchema).toBeNull();
    });

    it("maps a schema that is not an object to null", () => {
        const dto = createEditorStepTypeDto({ configSchema: "not a schema" });

        expect(mapEditorStepType(dto).configSchema).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/gateway/mapAutomationDefinition.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapAutomationDefinition } from "./mapAutomationDefinition.js";
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";

describe("mapAutomationDefinition", () => {
    it("maps the id, the name, the scope and the settings schema", () => {
        const settingsSchema = {
            type: "object",
            description: "Checks every link.",
            properties: { timeout: { type: "number" } }
        };
        const dto = createAutomationDefinitionDto({
            id: "automation-7",
            name: "Check links",
            models: ["cms.*", "wb.page"],
            settingsSchema
        });

        expect(mapAutomationDefinition(dto)).toEqual({
            id: "automation-7",
            name: "Check links",
            models: ["cms.*", "wb.page"],
            settingsSchema
        });
    });

    it("maps a null settings schema to null (an automation without settings)", () => {
        const dto = createAutomationDefinitionDto({ settingsSchema: null });

        expect(mapAutomationDefinition(dto).settingsSchema).toBeNull();
    });

    it("maps a settings schema that is not an object to null", () => {
        const dto = createAutomationDefinitionDto({ settingsSchema: ["x"] });

        expect(mapAutomationDefinition(dto).settingsSchema).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/gateway/mapWorkflowModelPage.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapWorkflowModelPage } from "./mapWorkflowModelPage.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";

describe("mapWorkflowModelPage", () => {
    it("maps the rows and the meta into a page", () => {
        const dto = createWorkflowModelPageDto({
            rows: [
                createWorkflowModelRowDto({
                    model: "cms.article",
                    modelId: "article",
                    name: "Article",
                    workflow: { id: "workflow-1", name: "Article review" }
                }),
                createWorkflowModelRowDto({
                    model: "cms.author",
                    modelId: "author",
                    name: "Author",
                    workflow: null
                })
            ],
            meta: { cursor: "cursor-2", hasMoreItems: true }
        });

        expect(mapWorkflowModelPage(dto)).toEqual({
            rows: [
                {
                    model: "cms.article",
                    modelId: "article",
                    name: "Article",
                    workflow: { id: "workflow-1", name: "Article review" }
                },
                { model: "cms.author", modelId: "author", name: "Author", workflow: null }
            ],
            cursor: "cursor-2",
            hasMoreItems: true
        });
    });

    it("maps a last page and an empty page", () => {
        const page = mapWorkflowModelPage(
            createWorkflowModelPageDto({ rows: [], meta: { cursor: null, hasMoreItems: false } })
        );

        expect(page).toEqual({ rows: [], cursor: null, hasMoreItems: false });
    });

    it("maps an absent cursor to null and an absent workflow to null", () => {
        const row = createWorkflowModelRowDto();
        Reflect.deleteProperty(row, "workflow");
        const dto = createWorkflowModelPageDto({ rows: [row] });
        Reflect.deleteProperty(dto.meta, "cursor");

        const page = mapWorkflowModelPage(dto);

        expect(page.cursor).toBeNull();
        expect(page.rows[0].workflow).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/gateway/mapAiTool.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapAiTool } from "./mapAiTool.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";

describe("mapAiTool", () => {
    it("maps every field of a tool", () => {
        const dto = createAiToolDto({
            name: "rewriteContent",
            title: "Rewrite content",
            description: "Rewrites a field.",
            changesContent: true
        });

        expect(mapAiTool(dto)).toEqual({
            name: "rewriteContent",
            title: "Rewrite content",
            description: "Rewrites a field.",
            changesContent: true
        });
    });

    it("keeps a read-only tool as not changing content", () => {
        expect(mapAiTool(createAiToolDto({ changesContent: false })).changesContent).toBe(false);
    });

    it("maps an absent changesContent to false", () => {
        const dto = createAiToolDto();
        Reflect.deleteProperty(dto, "changesContent");

        expect(mapAiTool(dto).changesContent).toBe(false);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/domain/WorkflowErrorCode.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/toJsonSchema.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapEditorWorkflow.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapEditorStepType.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapAutomationDefinition.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapWorkflowModelPage.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapAiTool.test.ts 2>&1 | tail -20
```

Expected: every test file fails with `Failed to resolve import` for the module it tests (`WorkflowErrorCode.js`, `editorFields.js`, `toJsonSchema.js`, the five mappers) and for `~/editor/testing/editorFixtures.js` types that do not exist yet. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/domain/types.ts`:

```ts
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
```

Create `packages/app-workflows/src/editor/domain/WorkflowErrorCode.ts`:

```ts
// The codes `GraphQLOperationError.code` carries for the editor's operations (R204, R276, R278).
export const WorkflowErrorCode = {
    NotFound: "Workflows/Workflow/NotFound",
    Conflict: "Workflows/Workflow/Conflict",
    Validation: "Workflows/Workflow/Validation",
    Persistence: "Workflows/Workflow/Persistence",
    HasActiveReviews: "Workflows/Workflow/HasActiveReviews",
    NotAuthorized: "Workflows/NotAuthorized"
} as const;
```

Create `packages/app-workflows/src/editor/gateway/dto.ts`:

```ts
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

/*
 * The response of one operation under the shared `workflows` root: the root field name maps to the
 * envelope the config gateway returns.
 */
export interface AiToolDto {
    name: string;
    title: string;
    description: string;
    changesContent: boolean;
}

export interface WorkflowsOperationResponse<TName extends string, TEnvelope> {
    workflows: Record<TName, TEnvelope>;
}
```

Create `packages/app-workflows/src/editor/gateway/editorFields.ts`:

```ts
// The `WorkflowsWorkflow` selection of the editor: models, steps with notification ids, save stamps.
export const EDITOR_WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    steps {
        id
        title
        color
        description
        type
        notifications {
            id
        }
        config
    }
    createdOn
    savedOn
    createdBy {
        id
        displayName
    }
    savedBy {
        id
        displayName
    }
`;

export const EDITOR_STEP_TYPE_FIELDS = /* GraphQL */ `
    type
    title
    available
    unavailableReason
    configSchema
`;

export const EDITOR_AUTOMATION_DEFINITION_FIELDS = /* GraphQL */ `
    id
    name
    models
    settingsSchema
`;

export const EDITOR_NOTIFICATION_TRANSPORT_FIELDS = /* GraphQL */ `
    id
    title
    description
`;

// The `WorkflowsTeamListResult` selection (R268): id, name and member count only.
export const EDITOR_TEAM_LIST_FIELDS = /* GraphQL */ `
    teams {
        id
        name
        memberCount
    }
    missingIds
`;

export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
    id
    name
    providerId
    providerName
`;

export const EDITOR_AI_TOOL_FIELDS = /* GraphQL */ `
    name
    title
    description
    changesContent
`;
```

Create `packages/app-workflows/src/editor/gateway/toJsonSchema.ts`:

```ts
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";

const isJsonSchema = (value: unknown): value is JsonSchema => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/*
 * The server sends a JSON schema as untyped JSON. An object is a schema; `null` and anything else
 * (no schema, a malformed value) is no schema, so the editor shows no generated form for it.
 */
export const toJsonSchema = (value: unknown): JsonSchema | null => {
    if (isJsonSchema(value)) {
        return value;
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/gateway/mapEditorWorkflow.ts`:

```ts
import type { EditorStepDto } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

const mapStep = (dto: EditorStepDto): EditorStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        notificationIds: dto.notifications.map(notification => notification.id),
        config: dto.config
    };
};

/*
 * Maps a `WorkflowsWorkflow`. `savedOn` and `createdOn` stay the exact strings the server sent:
 * the store call sends `savedOn` back and the server compares strings (D131).
 */
export const mapEditorWorkflow = (dto: EditorWorkflowDto): EditorWorkflow => {
    return {
        id: dto.id,
        name: dto.name,
        models: dto.models,
        steps: dto.steps.map(mapStep),
        createdOn: dto.createdOn,
        savedOn: dto.savedOn,
        createdBy: { id: dto.createdBy.id, displayName: dto.createdBy.displayName },
        savedBy: { id: dto.savedBy.id, displayName: dto.savedBy.displayName }
    };
};
```

Create `packages/app-workflows/src/editor/gateway/mapEditorStepType.ts`:

```ts
import type { EditorStepTypeDto } from "./dto.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { toJsonSchema } from "./toJsonSchema.js";

export const mapEditorStepType = (dto: EditorStepTypeDto): EditorStepType => {
    return {
        type: dto.type,
        title: dto.title,
        available: dto.available,
        unavailableReason: dto.unavailableReason ?? null,
        configSchema: toJsonSchema(dto.configSchema)
    };
};
```

Create `packages/app-workflows/src/editor/gateway/mapAutomationDefinition.ts`:

```ts
import type { AutomationDefinitionDto } from "./dto.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { toJsonSchema } from "./toJsonSchema.js";

export const mapAutomationDefinition = (dto: AutomationDefinitionDto): AutomationDefinition => {
    return {
        id: dto.id,
        name: dto.name,
        models: dto.models,
        settingsSchema: toJsonSchema(dto.settingsSchema)
    };
};
```

Create `packages/app-workflows/src/editor/gateway/mapWorkflowModelPage.ts`:

```ts
import type { WorkflowModelPageDto } from "./dto.js";
import type { WorkflowModelRowDto } from "./dto.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";

const mapRow = (dto: WorkflowModelRowDto): WorkflowModelRow => {
    const workflow = dto.workflow ?? null;
    if (!workflow) {
        return { model: dto.model, modelId: dto.modelId, name: dto.name, workflow: null };
    }
    return {
        model: dto.model,
        modelId: dto.modelId,
        name: dto.name,
        workflow: { id: workflow.id, name: workflow.name }
    };
};

export const mapWorkflowModelPage = (dto: WorkflowModelPageDto): WorkflowModelPage => {
    return {
        rows: dto.rows.map(mapRow),
        cursor: dto.meta.cursor ?? null,
        hasMoreItems: dto.meta.hasMoreItems
    };
};
```

Create `packages/app-workflows/src/editor/gateway/mapAiTool.ts`:

```ts
import type { AiToolDto } from "./dto.js";
import type { AiTool } from "~/editor/domain/types.js";

export const mapAiTool = (dto: AiToolDto): AiTool => {
    return {
        name: dto.name,
        title: dto.title,
        description: dto.description,
        changesContent: dto.changesContent ?? false
    };
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/domain/WorkflowErrorCode.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/toJsonSchema.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapEditorWorkflow.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapEditorStepType.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapAutomationDefinition.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapWorkflowModelPage.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/mapAiTool.test.ts 2>&1 | tail -20
```

Expected: PASS. Note to check on the first run: `JsonSchema` comes from Task 3: if its shape rejects the `{ type: "object", properties: ... }` literals the tests pass as `configSchema` and `settingsSchema`, those fields of the DTO are `unknown`, so only the domain-side assertions (`toBe(configSchema)`) are affected and need no change.

- [ ] **Step 5: Type-check**

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no TypeScript errors (`app-workflows` has `__tests__/` and co-located tests, so its build type-checks `src/**/*.test.ts` and the `testing/` folder). If it cannot resolve `JsonSchema`, build `@webiny/app-admin` first (see the precondition).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow editor domain types, DTOs and mappers" -m "The editor gets its domain types, workflow error codes, DTOs, GraphQL selections and mappers that keep savedOn as the exact string, plus the pure fixtures later tasks and the app packages import." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Field names the contract left open:** `EditorStep.notificationIds: string[]` (the wire shape is `notifications: { id }[]`, kept in `EditorStepInput.notifications` and the DTO); `EditorActor { id, displayName }` (only those two fields of `WorkflowsActor` are selected); `WorkflowModelRow { model, modelId, name, workflow }` where `model` is the namespace id, as the CMS `CmsEntryWorkflowModel` type has it; `EditorStep.config: unknown`. Later tasks use these names.
- **`WorkflowModelPageDto`:** the contract says `listModels(...): Promise<EditorEnvelope<WorkflowModelPageDto>>`. The server answers a list as `{ data, meta, error }`, so the DTO is `{ rows, meta }` (not a wire DTO) and each gateway folds the server's `data` and `meta` into it (Task 7).
- **Files beyond the contract's list:** `gateway/toJsonSchema.ts`, `gateway/mapEditorStepType.ts`, `gateway/mapAutomationDefinition.ts`, `gateway/mapWorkflowModelPage.ts`, `gateway/mapAiTool.ts` (R283: `changesContent`); the seven selections of `editorFields.ts` (the contract lists only `EDITOR_WORKFLOW_FIELDS`). `mapEditorWorkflow.ts` is the contract's.
- **`JsonSchema` type:** imported by deep path from Task 3's `JsonSchema.ts`. Checked by the consistency pass: Task 3 exports `interface JsonSchema` from that file (every key optional), so an object literal such as `{ type: "object" }` fits (R271). If Task 3 puts it elsewhere, change the one import in `domain/types.ts` and `gateway/toJsonSchema.ts`.
- **Attribution:** the contract's "Task 5" is delivered by Tasks 5, 5b and 5c, which add no renaming: Task 5 the domain and mappers, 5b the gateways, use cases and fakes, 5c the toasts ("Task 5b additions" in the contract) and the feature.
