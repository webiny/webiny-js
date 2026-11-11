### Task 3: `listStepTypes` from the registry and `listAutomationDefinitions`

Spec 7.1, 7.2, 10; D122, D129, D130, D133 point 2; R87, R98, R132, R138. `ListWorkflowStepTypesUseCase` returns a static list today. This task builds its rows from `StepTypeRegistryService` (plus the `ai` placeholder while no `ai` type is registered), and adds the shared `ListAutomationDefinitionsUseCase` and the GraphQL query `workflows.listAutomationDefinitions` so the editor can render each automation's settings form.

Row rules for `listStepTypes` (R132, R138):

- One row per registered step type: `type`, `title`, `available` and `unavailableReason` from `describeAvailability()`, `configSchema` = `zod.toJSONSchema(stepType.configSchema, { io: "input", unrepresentable: "any" })` (the form the author fills in: a field with `.default()` is not required; a schema that cannot be converted is a `WorkflowPersistenceError`, R87, R138) or `null` when the type has none.
- While no `ai` type is registered, an `ai` placeholder row exactly as today: `available` is the `aiPowerups` feature flag (read through `FeatureFlags`; a throwing read is a `WorkflowPersistenceError`), `unavailableReason` is `"AI powerups are not enabled."` when off and `null` when on, `configSchema: null`. A registered `ai` type replaces it and the flag is not read.
- Display order: `review`, `ai`, `automation`, then every other registered type in registration order. Missing ones are skipped.
- A throwing `describeAvailability` is a `WorkflowPersistenceError` (R87).
- Behaviour change: the `automation` row's `configSchema` is now the JSON schema of `automationStepConfigSchema` (it was `null`). Its `available` / `unavailableReason` follow the definition registry (`"No automation is defined."` while it is empty, available once a definition is registered).

`listAutomationDefinitions` (R138): needs `workflows.editor`, refusal action `"list automations"`; rows `{ id, name, models, settingsSchema }` sorted by `name`; `settingsSchema` = `zod.toJSONSchema(definition.settingsSchema, { io: "input", unrepresentable: "any" })` (input side: a field with `.default()` is not required) so one unrepresentable schema (a `z.date()`) never makes the list throw; any remaining conversion error is caught and returned as a `WorkflowPersistenceError` (R87, R138).

**Files:**
- Modify: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts` (comment only)
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Create: `packages/api-workflows/src/features/config/ListAutomationDefinitions/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListAutomationDefinitions/ListAutomationDefinitionsUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListAutomationDefinitions/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListAutomationDefinitions/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`
- Create: `packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `StepTypeRegistryService` (`~/features/stepTypes/StepTypeRegistryService/index.js`), `StepType.Interface` (`describeAvailability()`, `configSchema`, `type`, `title`), `createTestStepType` (`~tests/__helpers/TestStepType.js`), `REVIEW_STEP_TYPE`, `AUTOMATION_STEP_TYPE` (`~/domain/workflow/stepTypes.js`).
  - Task 2: `AutomationDefinitionRegistryService` (`~/features/automation/AutomationDefinitionRegistryService/index.js`), `automationStepConfigSchema`, `registerTestAutomation`, `TestAutomationDefinition`, `TEST_AUTOMATION_ID`.
  - Existing: `CurrentReviewViewer`, `WorkflowsPermissions` (`canEdit()`), `FeatureFlags`, `WorkflowsNotAuthorizedError({ action })`, `WorkflowPersistenceError`, `WorkflowStepTypeInfo` (`~/domain/config/types.js`), the `config/ListWorkflowStepTypes/` layout (`abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts`).
- Produces:
  - `ListWorkflowStepTypesUseCase.execute(): Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>`: signature and errors unchanged; dependencies become `[CurrentReviewViewer, WorkflowsPermissions, FeatureFlags, StepTypeRegistryService]` (it keeps `FeatureFlags` for the `ai` row).
  - `domain/config/types.ts`: `interface AutomationDefinitionInfo { id: string; name: string; models: string[]; settingsSchema: Record<string, unknown> }`.
  - `ListAutomationDefinitionsUseCase.execute(): Promise<Result<AutomationDefinitionInfo[], UseCaseError>>` with `UseCaseError = WorkflowsNotAuthenticatedError | WorkflowsNotAuthorizedError | WorkflowPersistenceError`; `ListAutomationDefinitionsFeature` (registered by `WorkflowsFeature` after `ListWorkflowStepTypesFeature`); `index.ts` exports the abstraction and the info type.
  - GraphQL (`graphql/WorkflowsSchemaFactory.ts`): `WorkflowsQuery.listAutomationDefinitions: WorkflowsAutomationDefinitionListResponse!` (placed between `listStepTypes` and `listUsers`), `type WorkflowsAutomationDefinition { id: String!, name: String!, models: [String!]!, settingsSchema: JSON }`, `type WorkflowsAutomationDefinitionListResponse { data: [WorkflowsAutomationDefinition!], error: WorkflowsError }`. The resolver calls only the use case (D132, R97).
  - Consumed by Task 18 (docs) and the admin phases.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID,
    testAutomationSettingsSchema
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

/** Registers a definition with the given id, name and settings schema. */
const registerDefinition = (
    id: string,
    name: string,
    settingsSchema: zod.ZodType,
    models: string[] = ["*"]
) => {
    class DefinitionImpl implements AutomationDefinition.Interface {
        public readonly id = id;
        public readonly name = name;
        public readonly models = models;
        public readonly settingsSchema = settingsSchema;

        public async run(): Promise<AutomationDefinition.Outcome> {
            return { type: "approved" };
        }
    }
    const implementation = AutomationDefinition.createImplementation({
        implementation: DefinitionImpl,
        dependencies: []
    });
    return (container: Container): void => {
        container.register(implementation);
    };
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listAutomations: context.container.resolve(ListAutomationDefinitionsUseCase)
    };
};

describe("ListAutomationDefinitionsUseCase (R138)", () => {
    it("lists nothing when no automation is defined", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        expect(expectOk(await listAutomations.execute())).toEqual([]);
    });

    it("lists the definitions with their models and settings as JSON schema", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTestAutomation(container, { models: ["cms.*"] });
            }
        });

        const rows = expectOk(await listAutomations.execute());

        expect(rows).toEqual([
            {
                id: TEST_AUTOMATION_ID,
                name: "Test automation",
                models: ["cms.*"],
                settingsSchema: zod.toJSONSchema(testAutomationSettingsSchema, {
                    io: "input",
                    unrepresentable: "any"
                })
            }
        ]);
        expect(rows[0].settingsSchema).toMatchObject({ type: "object" });
        expect(Object.keys((rows[0].settingsSchema.properties ?? {}) as object)).toEqual([
            "mode",
            "comment"
        ]);
    });

    it("does not require a field that has a default (input side of the schema)", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const rows = expectOk(await listAutomations.execute());

        // `mode` has `.default("approve")`: the author may leave it out.
        expect(rows[0].settingsSchema.required ?? []).not.toContain("mode");
    });

    it("returns the workflow persistence error when a schema cannot be converted (R87, R138)", async () => {
        const { listAutomations } = await createListContext({
            setup: registerDefinition("broken", "Broken", {} as never)
        });

        const result = await listAutomations.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("sorts the rows by name", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                registerDefinition("zulu", "Zulu", zod.object({}))(container);
                registerDefinition("alpha", "Alpha", zod.object({}))(container);
                registerDefinition("mike", "Mike", zod.object({}))(container);
            }
        });

        const rows = expectOk(await listAutomations.execute());

        expect(rows.map(row => row.name)).toEqual(["Alpha", "Mike", "Zulu"]);
    });

    it("lists a definition whose schema JSON schema cannot represent (unrepresentable: any)", async () => {
        const { listAutomations } = await createListContext({
            setup: registerDefinition("dated", "Dated", zod.object({ at: zod.date() }))
        });

        const result = await listAutomations.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value?.[0].settingsSchema).toMatchObject({
            type: "object",
            properties: { at: {} }
        });
    });

    it("allows a full-access permission set", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listAutomations.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listAutomations } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listAutomations.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list automations" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listAutomations } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listAutomations.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listAutomations } = await createListContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listAutomations.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
    });
});
```

Update `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`.

Add imports:

```ts
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
```

In the first test ("lists review, AI and automation for an editor; AI is off without the flag"), the `automation` row's `configSchema` is no longer `null`:

```ts
            {
                type: "automation",
                title: "Automation",
                available: false,
                unavailableReason: "No automation is defined.",
                configSchema: zod.toJSONSchema(automationStepConfigSchema, { io: "input", unrepresentable: "any" })
            }
```

and add after its last `expect`:

```ts
        expect(stepTypes[2].configSchema).toMatchObject({
            type: "object",
            required: ["automationId", "settings"]
        });
```

Add these tests inside the `describe` (before "allows a full-access permission set"):

```ts
    it("marks automation available once a definition is registered", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[2]).toMatchObject({
            type: "automation",
            available: true,
            unavailableReason: null
        });
    });

    it("lists other registered types after the built-in order, in registration order", async () => {
        const zeta = createTestStepType({
            type: "zeta",
            title: "Zeta",
            availability: { available: false, unavailableReason: "Zeta is off." },
            configSchema: zod.object({ level: zod.number() })
        });
        const alpha = createTestStepType({ type: "alpha", title: "Alpha" });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(zeta.implementation);
                container.register(alpha.implementation);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual([
            "review",
            "ai",
            "automation",
            "zeta",
            "alpha"
        ]);
        expect(stepTypes[3]).toEqual({
            type: "zeta",
            title: "Zeta",
            available: false,
            unavailableReason: "Zeta is off.",
            configSchema: zod.toJSONSchema(zod.object({ level: zod.number() }), { io: "input", unrepresentable: "any" })
        });
        expect(stepTypes[4]).toEqual({
            type: "alpha",
            title: "Alpha",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("lets a registered ai type replace the placeholder row without reading the flag", async () => {
        const ai = createTestStepType({
            type: "ai",
            title: "AI step",
            availability: { available: true, unavailableReason: null },
            configSchema: zod.object({ prompt: zod.string() })
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(ai.implementation);
                // The flag is not read when an `ai` type is registered.
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        expect(stepTypes[1]).toEqual({
            type: "ai",
            title: "AI step",
            available: true,
            unavailableReason: null,
            configSchema: zod.toJSONSchema(zod.object({ prompt: zod.string() }), { io: "input", unrepresentable: "any" })
        });
    });

    it("lists a field with a default as not required (input side of the schema)", async () => {
        const defaulted = createTestStepType({
            type: "defaulted",
            title: "Defaulted",
            configSchema: zod.object({ level: zod.number().default(1) })
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(defaulted.implementation);
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        const row = stepTypes.find(item => item.type === "defaulted");
        expect((row?.configSchema?.required ?? []) as string[]).not.toContain("level");
    });

    it("returns the workflow persistence error when a type's schema cannot be converted (R87, R138)", async () => {
        const broken = createTestStepType({ type: "broken-schema", configSchema: {} as never });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("returns the workflow persistence error when a type's availability throws (R87)", async () => {
        const broken = createTestStepType({
            type: "broken",
            describeAvailability: async () => {
                throw new Error("Availability is down.");
            }
        });
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.register(broken.implementation);
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Availability is down.");
    });
```

Update `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`.

Add imports:

```ts
import zod from "zod";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
```

Add the query after `LIST_STEP_TYPES`:

```ts
const LIST_AUTOMATION_DEFINITIONS = /* GraphQL */ `
    query ListAutomationDefinitions {
        workflows {
            listAutomationDefinitions {
                data {
                    id
                    name
                    models
                    settingsSchema
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

Add row/envelope/result types next to the step type ones:

```ts
interface AutomationDefinitionRow {
    id: string;
    name: string;
    models: string[];
    settingsSchema: JsonSchemaRow | null;
}

interface AutomationDefinitionsEnvelope {
    data: AutomationDefinitionRow[] | null;
    error: ErrorRow | null;
}

interface ListAutomationDefinitionsResult {
    listAutomationDefinitions: AutomationDefinitionsEnvelope;
}
```

and the api method in `createApi` (after `listStepTypes`):

```ts
        listAutomationDefinitions:
            createQuery<GraphQLBody<WorkflowsRoot<ListAutomationDefinitionsResult>>>(
                LIST_AUTOMATION_DEFINITIONS
            ),
```

In "lists the step types with AI unavailable without AI powerups (D130)", the `automation` expectation becomes:

```ts
        expect(automation).toEqual({
            type: "automation",
            title: "Automation",
            available: false,
            unavailableReason: "No automation is defined.",
            configSchema: zod.toJSONSchema(automationStepConfigSchema, { io: "input", unrepresentable: "any" })
        });
```

Add after the "refuses the step types to a user without editor" test:

```ts
    it("lists the step types with automation available once a definition is registered", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAutomation(container);
            }
        });

        const [response] = await api.listStepTypes();
        const automation = response.data.workflows.listStepTypes.data?.find(
            row => row.type === "automation"
        );

        expect(automation).toMatchObject({ available: true, unavailableReason: null });
    });

    it("lists the automation definitions with their settings schema (R138)", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAutomation(container, { models: ["cms.*"] });
            }
        });

        const [response] = await api.listAutomationDefinitions();
        const { data, error } = response.data.workflows.listAutomationDefinitions;

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0]).toMatchObject({
            id: TEST_AUTOMATION_ID,
            name: "Test automation",
            models: ["cms.*"]
        });
        expect(data?.[0].settingsSchema).toMatchObject({ type: "object" });
        expect(Object.keys(data?.[0].settingsSchema?.properties ?? {})).toEqual([
            "mode",
            "comment"
        ]);
    });

    it("lists no automation definitions when none is registered", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listAutomationDefinitions();

        expect(response.data.workflows.listAutomationDefinitions).toEqual({
            data: [],
            error: null
        });
    });

    it("refuses the automation definitions to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listAutomationDefinitions();

        expect(response.data.workflows.listAutomationDefinitions).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list automations.",
                data: { action: "list automations" }
            }
        });
    });
```

In "exposes the shared types the app schemas reuse (R100)", replace the `WorkflowsQuery` expectation and add the new types:

```ts
        expect(memberNames(types, "WorkflowsQuery")).toEqual([
            "getSettings",
            "listStepTypes",
            "listAutomationDefinitions",
            "listUsers"
        ]);
        expect(memberNames(types, "WorkflowsAutomationDefinition")).toEqual([
            "id",
            "name",
            "models",
            "settingsSchema"
        ]);
        expect(memberNames(types, "WorkflowsAutomationDefinitionListResponse")).toEqual([
            "data",
            "error"
        ]);
```

Update `packages/api-workflows/__tests__/registration.test.ts`: add

```ts
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";
```

and, after the `ListWorkflowStepTypesUseCase` line:

```ts
        expect(container.resolveAll(ListAutomationDefinitionsUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `ListAutomationDefinitions.test.ts` and `registration.test.ts` fail to import the new use case; in `ListWorkflowStepTypes.test.ts` the first test fails on the `automation` row's `configSchema` (`null`), "marks automation available", the custom type order, the replaced `ai` row and the throwing availability tests fail on the static list; in `workflowsSchema.test.ts` the automation `configSchema`, the new query tests and the introspection expectation fail (`Cannot query field "listAutomationDefinitions"`). Record the RED output.

- [ ] **Step 3: `listStepTypes` from the registry**

In `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`:

1. Add imports (`AUTOMATION_STEP_TYPE` joins the existing `stepTypes.js` import, `reviewStepConfigSchema` is no longer used here and is removed):

```ts
import type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
import { AUTOMATION_STEP_TYPE, REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
```

2. Constructor:

```ts
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private stepTypes: StepTypeRegistryService.Interface
    ) {}
```

3. Replace everything from `// AI steps need the AI powerups entitlement (D130).` to the end of `execute` with:

```ts
        // One row per registered type, by `type` (R138).
        const rowsByType = new Map<string, WorkflowStepTypeInfo>();
        try {
            for (const stepType of this.stepTypes.list()) {
                const availability = await stepType.describeAvailability();
                rowsByType.set(stepType.type, {
                    type: stepType.type,
                    title: stepType.title,
                    available: availability.available,
                    unavailableReason: availability.unavailableReason,
                    // Input side (what the author fills in); the surrounding try/catch turns a
                    // schema that cannot be converted into a persistence error (R87, R138).
                    configSchema: stepType.configSchema
                        ? zod.toJSONSchema(stepType.configSchema, {
                              io: "input",
                              unrepresentable: "any"
                          })
                        : null
                });
            }
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }

        // While no `ai` type is registered (phase 6 registers it), the row stays, as it was
        // before the registry: AI steps need the AI powerups entitlement (D130, R132).
        if (!rowsByType.has("ai")) {
            let aiAvailable: boolean;
            try {
                aiAvailable = this.featureFlags.get().isEnabled("aiPowerups");
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            rowsByType.set("ai", {
                type: "ai",
                title: "AI",
                available: aiAvailable,
                unavailableReason: aiAvailable ? null : "AI powerups are not enabled.",
                configSchema: null
            });
        }

        // Fixed display order first, then the other types in registration order (R138).
        const displayOrder = [REVIEW_STEP_TYPE, "ai", AUTOMATION_STEP_TYPE];
        const rows = [
            ...displayOrder
                .map(type => rowsByType.get(type))
                .filter((row): row is WorkflowStepTypeInfo => row !== undefined),
            ...[...rowsByType.values()].filter(row => !displayOrder.includes(row.type))
        ];
        return Result.ok(rows);
    }
}

export const ListWorkflowStepTypesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStepTypesUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, FeatureFlags, StepTypeRegistryService]
});
```

(The `class` closing brace and the `export const` are part of the replaced tail; the part of `execute` before the replaced block — viewer, permission check — is unchanged.)

In `packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts` replace the abstraction's JSDoc with:

```ts
/**
 * The step types the workflow editor offers, with availability (D130, D133 point 2, R98, R138):
 * needs `workflows.editor`. Built from the step type registry; while no `ai` type is registered
 * the `ai` row stays, available with the `aiPowerups` flag (R132).
 */
```

In `packages/api-workflows/src/domain/config/types.ts` replace the JSDoc of `WorkflowStepTypeInfo` with

```ts
/**
 * A step type the workflow editor can offer (D130): a row of `listStepTypes`, built from the
 * `StepType` registry (R138).
 */
```

and add after the `WorkflowStepTypeInfo` interface:

```ts
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
```

- [ ] **Step 4: `ListAutomationDefinitionsUseCase`**

Create `packages/api-workflows/src/features/config/ListAutomationDefinitions/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AutomationDefinitionInfo } from "~/domain/config/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListAutomationDefinitionsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListAutomationDefinitionsUseCaseErrors[keyof IListAutomationDefinitionsUseCaseErrors];

export interface IListAutomationDefinitionsUseCase {
    execute(): Promise<Result<AutomationDefinitionInfo[], UseCaseError>>;
}

/**
 * The automations a workflow author can add as a step, with the JSON schema of each one's
 * settings (spec 7.2, D133 point 2, R138): needs `workflows.editor`. Sorted by name. The shared
 * `listAutomationDefinitions` GraphQL operation calls this.
 */
export const ListAutomationDefinitionsUseCase =
    createAbstraction<IListAutomationDefinitionsUseCase>("ListAutomationDefinitionsUseCase");

export namespace ListAutomationDefinitionsUseCase {
    export type Interface = IListAutomationDefinitionsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<AutomationDefinitionInfo[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/ListAutomationDefinitions/ListAutomationDefinitionsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import zod from "zod";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { AutomationDefinitionInfo } from "~/domain/config/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListAutomationDefinitionsUseCase as UseCase } from "./abstractions.js";

class ListAutomationDefinitionsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list automations" }));
        }

        let rows: AutomationDefinitionInfo[];
        try {
            rows = this.definitions.list().map(definition => {
                return {
                    id: definition.id,
                    name: definition.name,
                    models: [...definition.models],
                    // Input side (what the author fills in; a field with `.default()` is not
                    // required). `unrepresentable: "any"`: one schema JSON schema cannot express
                    // (a date) must not make the whole list throw (R138).
                    settingsSchema: zod.toJSONSchema(definition.settingsSchema, {
                        io: "input",
                        unrepresentable: "any"
                    })
                };
            });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
        return Result.ok(rows);
    }
}

export const ListAutomationDefinitionsUseCase = UseCase.createImplementation({
    implementation: ListAutomationDefinitionsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, AutomationDefinitionRegistryService]
});
```

Create `packages/api-workflows/src/features/config/ListAutomationDefinitions/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

export const ListAutomationDefinitionsFeature = createFeature({
    name: "Workflows/ListAutomationDefinitions",
    register(container) {
        container.register(ListAutomationDefinitionsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/ListAutomationDefinitions/index.ts`:

```ts
export { ListAutomationDefinitionsUseCase } from "./abstractions.js";
export type { AutomationDefinitionInfo } from "~/domain/config/types.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add

```ts
import { ListAutomationDefinitionsFeature } from "~/features/config/ListAutomationDefinitions/feature.js";
```

and, after `ListWorkflowStepTypesFeature.register(container);`:

```ts
        ListAutomationDefinitionsFeature.register(container);
```

- [ ] **Step 5: GraphQL**

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`:

1. Import the use case next to `ListWorkflowStepTypesUseCase`:

```ts
import { ListAutomationDefinitionsUseCase } from "~/features/config/ListAutomationDefinitions/index.js";
```

2. In the shared type defs, after `WorkflowsStepTypeListResponse` add:

```graphql
    type WorkflowsAutomationDefinition {
        id: String!
        name: String!
        "Where it may be used: '*', '<app>.*' or exact namespace ids (D35)."
        models: [String!]!
        "JSON schema of the settings the workflow author fills in when adding the step."
        settingsSchema: JSON
    }

    type WorkflowsAutomationDefinitionListResponse {
        data: [WorkflowsAutomationDefinition!]
        error: WorkflowsError
    }
```

3. In `type WorkflowsQuery`, between `listStepTypes` and `listUsers`:

```graphql
        listAutomationDefinitions: WorkflowsAutomationDefinitionListResponse!
```

4. After the `WorkflowsQuery.listStepTypes` resolver add:

```ts
        builder.addResolver({
            path: "WorkflowsQuery.listAutomationDefinitions",
            dependencies: [ListAutomationDefinitionsUseCase],
            resolver: (listAutomations: ListAutomationDefinitionsUseCase.Interface) => {
                return async () => {
                    const result = await listAutomations.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time).
Expected: PASS.

Re-run the earlier 5.1 tests (`__tests__/stepTypes`, `__tests__/automation`, `__tests__/workflow/StoreWorkflowStepTypes.test.ts`, `__tests__/workflow/StoreWorkflowAutomationSteps.test.ts`, `__tests__/domain/WorkflowValidator.test.ts`) and the CMS and WB `workflowWrappers.test.ts` with `yarn test` by path, and the phase 1-4 workflow tests touched by the validator swap (the Task 1 neighbour list) with `yarn test` and then `yarn test:os`.
Expected: PASS.

If the CMS or WB packages snapshot or list the `WorkflowsQuery` fields or the step types (`grep -rn "listStepTypes" packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__`), update those expectations the same way (a `listAutomationDefinitions` field; the `automation` row's `configSchema`).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): list step types from the registry and add the listAutomationDefinitions operation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
