### Task 5b: Editor gateways, use cases and fakes

R202, R204, R237, R238, R243, R268, R275, R276, R278; Q42, Q43; Review Focus 1. The gateway and use-case layer of the editor core in `packages/app-workflows/src/editor`, on the types of Task 5: the editor gateway and use-case interfaces with the one shared `WorkflowEditorUseCases` (a plain class, R237; each app subclasses it in Task 7), the shared config gateway and use cases over the `workflows` root (bound once, not subclassed), and the vitest fakes later tasks use.

Behaviour:

- **Errors (R204):** the use cases turn an error envelope into a thrown `GraphQLOperationError` that keeps the server's `code`, `message` and `data` (a conflict keeps `{ savedOn, savedBy }`, a blocked delete keeps `{ count, reviews }`, a validation error keeps its `{ stepId, field, workflowId }`); an envelope with neither data nor error throws with the message `The request failed.`; a transport `Error` passes as it is. Presenters (Tasks 9, 10) switch on `error.code` with `WorkflowErrorCode`.
- **`storeWorkflow`** passes `{ data, savedOn }` to the gateway untouched: the loaded `savedOn` string goes back unchanged (null for a new workflow), and the returned workflow carries the new `savedOn` string unchanged (Review Focus 1).
- **R237:** `WorkflowEditorUseCases` is exported plain and carries no abstraction metadata; a two-subclass test shows two apps get their own instance and gateway, and that registering the plain class throws.
- **Config use cases:** `listStepTypes` keeps the order the server returns (R269) and narrows `configSchema`; `listAutomationDefinitions` narrows `settingsSchema`; `listAiModels` and `listAiTools` run only when called (the presenter calls them only when the `ai` step type is available and has a `configSchema`, R275, because the field exists only with `ai-powerups`); `listTeams` passes `search`, `ids` and `limit` through (R268). The gateway documents are unexported constants of `WorkflowConfigGatewayImpl.ts`.

**Files:** (all under `packages/app-workflows/src/editor`)
- Create: `gateway/IWorkflowEditorGateway.ts`
- Create: `gateway/IWorkflowConfigGateway.ts`
- Create: `gateway/WorkflowConfigGateway.ts` (token)
- Create: `gateway/WorkflowConfigGatewayImpl.ts`, `gateway/WorkflowConfigGatewayImpl.test.ts`
- Create: `useCases/toOperationError.ts`, `useCases/toOperationError.test.ts`
- Create: `useCases/IWorkflowEditorUseCases.ts`
- Create: `useCases/WorkflowEditorUseCases.ts` (plain shared class), `useCases/WorkflowEditorUseCases.test.ts`
- Create: `useCases/IWorkflowConfigUseCases.ts`
- Create: `useCases/WorkflowConfigUseCases.ts` (token)
- Create: `useCases/WorkflowConfigUseCasesImpl.ts`, `useCases/WorkflowConfigUseCasesImpl.test.ts`
- Create: `testing/fakeWorkflowEditorUseCases.ts`, `testing/fakeWorkflowConfigUseCases.ts`

**Interfaces:**
- Consumes (Task 5): the domain types, `WorkflowErrorCode`, the DTOs (`EditorEnvelope`, `EditorErrorDto`, `EditorStepTypeDto`, `AutomationDefinitionDto`, `WorkflowsOperationResponse`), the selections of `editorFields.ts`, the mappers and `editorFixtures.ts`. Existing (verified): `GraphQLOperationError` (`@webiny/app/errors/index.js`, constructor `{ message, code?, data? }`), `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`, `execute<TResult, TVariables>({ query, variables })`), `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`), `createAbstraction` (`@webiny/feature/admin`).
- Produces: `IWorkflowEditorGateway { listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>; getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>; storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>; deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> }`, `ListWorkflowModelsParams { search: string; limit: number; after: string | null }`, `StoreWorkflowParams { data: EditorWorkflowInput; savedOn: string | null }`; `IWorkflowEditorUseCases` (the same four methods over domain types: `listModels` answers `WorkflowModelPage`, the others `EditorWorkflow`; throws `GraphQLOperationError`); the plain class `WorkflowEditorUseCases` (constructor `(gateway: IWorkflowEditorGateway)`); `IWorkflowConfigGateway`, `WorkflowConfigGateway` (token), `ListTeamsParams { search: string | null; ids: string[] | null; limit: number | null }`; `IWorkflowConfigUseCases { listStepTypes(); listAutomationDefinitions(); listNotificationTransports(); listTeams(params: ListTeamsParams); listAiModels(); listAiTools() }`, `WorkflowConfigUseCases` (token, implemented by `WorkflowConfigUseCasesImpl.ts`); `toOperationError`; `createFakeEditorUseCases` / `FakeWorkflowEditorUseCases` and `createFakeConfigUseCases` / `FakeWorkflowConfigUseCases`.

**Test runner note:** admin package, `yarn test <path>` only. One named import per line, deep `~/` paths.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/useCases/toOperationError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { toOperationError } from "./toOperationError.js";

describe("toOperationError", () => {
    it("keeps the message, the code and the data of the envelope error", () => {
        const data = { stepId: "step-1", field: "title", workflowId: null };

        const error = toOperationError({
            code: "Workflows/Workflow/Validation",
            message: "Step needs a title.",
            data
        });

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Step needs a title.");
        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toBe(data);
    });

    it("falls back to a message and null code and data when the error has none", () => {
        const error = toOperationError({ code: null, message: null, data: null });

        expect(error.message).toBe("The request failed.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("answers the fallback error when the envelope has no error at all", () => {
        const error = toOperationError(null);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("The request failed.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorUseCases } from "./WorkflowEditorUseCases.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";

type FakeGateway = { [K in keyof IWorkflowEditorGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listModels: vi.fn(),
        getWorkflow: vi.fn(),
        storeWorkflow: vi.fn(),
        deleteWorkflow: vi.fn()
    };
};

const listParams: ListWorkflowModelsParams = { search: "art", limit: 20, after: "cursor-1" };

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Article review",
    models: ["cms.article"],
    steps: [
        {
            id: "step-1",
            title: "Editorial check",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

const storeParams: StoreWorkflowParams = { data: input, savedOn: EDITOR_SAVED_ON };

const conflictError: EditorErrorDto = {
    code: WorkflowErrorCode.Conflict,
    message: "The workflow was changed by Grace Hopper.",
    data: { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { id: "user-2", displayName: "Grace" } }
};

interface OperationCase {
    name: string;
    method: keyof IWorkflowEditorGateway;
    run: (useCases: WorkflowEditorUseCases) => Promise<unknown>;
}

const operationCases: OperationCase[] = [
    { name: "listModels", method: "listModels", run: useCases => useCases.listModels(listParams) },
    { name: "getWorkflow", method: "getWorkflow", run: useCases => useCases.getWorkflow("workflow-1") },
    {
        name: "storeWorkflow",
        method: "storeWorkflow",
        run: useCases => useCases.storeWorkflow(storeParams)
    },
    {
        name: "deleteWorkflow",
        method: "deleteWorkflow",
        run: useCases => useCases.deleteWorkflow("workflow-1")
    }
];

describe("WorkflowEditorUseCases", () => {
    let gateway: FakeGateway;
    let useCases: WorkflowEditorUseCases;

    beforeEach(() => {
        gateway = createFakeGateway();
        useCases = new WorkflowEditorUseCases(gateway);
    });

    describe("listModels", () => {
        it("passes the params untouched and maps the rows with the page meta", async () => {
            gateway.listModels.mockResolvedValue({
                data: createWorkflowModelPageDto({
                    rows: [
                        createWorkflowModelRowDto(),
                        createWorkflowModelRowDto({
                            model: "cms.author",
                            modelId: "author",
                            name: "Author",
                            workflow: null
                        })
                    ],
                    meta: { cursor: "cursor-2", hasMoreItems: true }
                }),
                error: null
            });

            const page = await useCases.listModels(listParams);

            expect(gateway.listModels).toHaveBeenCalledWith(listParams);
            expect(page.cursor).toBe("cursor-2");
            expect(page.hasMoreItems).toBe(true);
            expect(page.rows.map(row => row.model)).toEqual(["cms.article", "cms.author"]);
            expect(page.rows[1].workflow).toBeNull();
        });
    });

    describe("getWorkflow", () => {
        it("passes the id and maps the workflow", async () => {
            gateway.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            const workflow = await useCases.getWorkflow("workflow-1");

            expect(gateway.getWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(workflow).toEqual(createEditorWorkflow());
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            await useCases.storeWorkflow(storeParams);

            expect(gateway.storeWorkflow).toHaveBeenCalledTimes(1);
            const sent: StoreWorkflowParams = gateway.storeWorkflow.mock.calls[0][0];
            expect(sent).toBe(storeParams);
            expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
        });

        it("sends null for a new workflow", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            await useCases.storeWorkflow({ data: input, savedOn: null });

            const sent: StoreWorkflowParams = gateway.storeWorkflow.mock.calls[0][0];
            expect(sent.savedOn).toBeNull();
        });

        it("returns the stored workflow with the new savedOn string unchanged", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" }),
                error: null
            });

            const workflow = await useCases.storeWorkflow(storeParams);

            expect(workflow.savedOn).toBe("2026-10-18T11:30:00.456Z");
        });

        it("throws a conflict that keeps the code and the savedOn and savedBy of the other save", async () => {
            gateway.storeWorkflow.mockResolvedValue({ data: null, error: conflictError });

            const promise = useCases.storeWorkflow(storeParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Conflict,
                message: "The workflow was changed by Grace Hopper.",
                data: conflictError.data
            });
        });

        it("throws a validation error that keeps the step and the field", async () => {
            const data = { stepId: "step-1", field: "config.teams", workflowId: null };
            gateway.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "Step needs a team.",
                    data
                }
            });

            const promise = useCases.storeWorkflow(storeParams);

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                data
            });
        });
    });

    describe("deleteWorkflow", () => {
        it("passes the id and maps the deleted workflow", async () => {
            gateway.deleteWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            const workflow = await useCases.deleteWorkflow("workflow-1");

            expect(gateway.deleteWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(workflow.id).toBe("workflow-1");
        });

        it("throws a blocked delete that keeps the count and the reviews", async () => {
            const data = {
                count: 2,
                reviews: [{ reviewId: "review-1", title: "Spring campaign" }]
            };
            gateway.deleteWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.HasActiveReviews,
                    message: "The workflow has reviews in progress.",
                    data
                }
            });

            const promise = useCases.deleteWorkflow("workflow-1");

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });
    });

    describe("error mapping (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotFound,
                        message: "No workflow.",
                        data: { id: "workflow-1" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotFound,
                    message: "No workflow.",
                    data: { id: "workflow-1" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws when the server answers with neither data nor error",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({ data: null, error: null });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                gateway[operationCase.method].mockRejectedValue(failure);

                await expect(operationCase.run(useCases)).rejects.toBe(failure);
            }
        );
    });

    describe("per-app subclasses (one container, two apps)", () => {
        const GatewayA = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayA");
        const GatewayB = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayB");
        const UseCasesA = createAbstraction<IWorkflowEditorUseCases>("Test/EditorUseCasesA");
        const UseCasesB = createAbstraction<IWorkflowEditorUseCases>("Test/EditorUseCasesB");

        class UseCasesAImpl extends WorkflowEditorUseCases implements IWorkflowEditorUseCases {}
        class UseCasesBImpl extends WorkflowEditorUseCases implements IWorkflowEditorUseCases {}

        const BoundA = UseCasesA.createImplementation({
            implementation: UseCasesAImpl,
            dependencies: [GatewayA]
        });
        const BoundB = UseCasesB.createImplementation({
            implementation: UseCasesBImpl,
            dependencies: [GatewayB]
        });

        it("binds each subclass to its own gateway with its own instance", async () => {
            const gatewayA = createFakeGateway();
            const gatewayB = createFakeGateway();
            gatewayA.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ id: "workflow-a" }),
                error: null
            });
            gatewayB.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ id: "workflow-b" }),
                error: null
            });
            const container = new Container();
            container.registerInstance(GatewayA, gatewayA);
            container.registerInstance(GatewayB, gatewayB);
            container.register(BoundA).inSingletonScope();
            container.register(BoundB).inSingletonScope();

            const a = container.resolve(UseCasesA);
            const b = container.resolve(UseCasesB);
            const workflowA = await a.getWorkflow("workflow-a");
            const workflowB = await b.getWorkflow("workflow-b");

            expect(a).not.toBe(b);
            expect(container.resolve(UseCasesA)).toBe(a);
            expect(workflowA.id).toBe("workflow-a");
            expect(workflowB.id).toBe("workflow-b");
            expect(gatewayA.getWorkflow).toHaveBeenCalledTimes(1);
            expect(gatewayB.getWorkflow).toHaveBeenCalledTimes(1);
        });

        it("the shared class carries no abstraction metadata, so it cannot be registered as is (R237)", () => {
            const container = new Container();

            expect(() => container.register(WorkflowEditorUseCases)).toThrow(
                "No abstraction metadata found"
            );
        });
    });
});
```

Create `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./WorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "./WorkflowConfigUseCasesImpl.js";
import { WorkflowConfigGateway } from "~/editor/gateway/WorkflowConfigGateway.js";
import type { IWorkflowConfigGateway } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

type FakeGateway = { [K in keyof IWorkflowConfigGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listStepTypes: vi.fn(),
        listAutomationDefinitions: vi.fn(),
        listNotificationTransports: vi.fn(),
        listTeams: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};

const teamParams: ListTeamsParams = { search: "ed", ids: null, limit: 20 };

interface OperationCase {
    name: string;
    method: keyof IWorkflowConfigGateway;
    run: (useCases: UseCasesAbstraction.Interface) => Promise<unknown>;
}

const operationCases: OperationCase[] = [
    { name: "listStepTypes", method: "listStepTypes", run: useCases => useCases.listStepTypes() },
    {
        name: "listAutomationDefinitions",
        method: "listAutomationDefinitions",
        run: useCases => useCases.listAutomationDefinitions()
    },
    {
        name: "listNotificationTransports",
        method: "listNotificationTransports",
        run: useCases => useCases.listNotificationTransports()
    },
    { name: "listTeams", method: "listTeams", run: useCases => useCases.listTeams(teamParams) },
    { name: "listAiModels", method: "listAiModels", run: useCases => useCases.listAiModels() },
    { name: "listAiTools", method: "listAiTools", run: useCases => useCases.listAiTools() }
];

describe("WorkflowConfigUseCases", () => {
    let gateway: FakeGateway;
    let useCases: UseCasesAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigUseCases).inSingletonScope();
        useCases = container.resolve(UseCasesAbstraction);
    });

    it("lists the step types in the order the server returns them and narrows the schema", async () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        gateway.listStepTypes.mockResolvedValue({
            data: [
                createEditorStepTypeDto({ type: "ai", title: "AI", configSchema: null }),
                createEditorStepTypeDto({ type: "review", configSchema }),
                createEditorStepTypeDto({
                    type: "automation",
                    available: false,
                    unavailableReason: "No automations are available."
                })
            ],
            error: null
        });

        const stepTypes = await useCases.listStepTypes();

        expect(stepTypes.map(stepType => stepType.type)).toEqual(["ai", "review", "automation"]);
        expect(stepTypes[1].configSchema).toBe(configSchema);
        expect(stepTypes[0].configSchema).toBeNull();
        expect(stepTypes[2].unavailableReason).toBe("No automations are available.");
    });

    it("lists the automation definitions and narrows the settings schema", async () => {
        const settingsSchema = { type: "object", properties: { timeout: { type: "number" } } };
        gateway.listAutomationDefinitions.mockResolvedValue({
            data: [
                createAutomationDefinitionDto({ id: "automation-1", settingsSchema }),
                createAutomationDefinitionDto({ id: "automation-2", settingsSchema: null })
            ],
            error: null
        });

        const definitions = await useCases.listAutomationDefinitions();

        expect(definitions.map(definition => definition.id)).toEqual([
            "automation-1",
            "automation-2"
        ]);
        expect(definitions[0].settingsSchema).toBe(settingsSchema);
        expect(definitions[1].settingsSchema).toBeNull();
    });

    it("lists the notification transports as they are", async () => {
        const transports = [
            createNotificationTransport(),
            createNotificationTransport({ id: "slack", title: "Slack", description: "Posts." })
        ];
        gateway.listNotificationTransports.mockResolvedValue({ data: transports, error: null });

        const result = await useCases.listNotificationTransports();

        expect(result).toEqual(transports);
    });

    it("lists the teams with the params passed through and the missing ids", async () => {
        gateway.listTeams.mockResolvedValue({
            data: {
                teams: [createWorkflowTeamSummary({ memberCount: 0 })],
                missingIds: ["team-gone"]
            },
            error: null
        });

        const result = await useCases.listTeams(teamParams);

        expect(gateway.listTeams).toHaveBeenCalledWith(teamParams);
        expect(result.teams[0].memberCount).toBe(0);
        expect(result.missingIds).toEqual(["team-gone"]);
    });

    it("lists the AI models as they are and the AI tools mapped with changesContent, only when called", async () => {
        gateway.listAiModels.mockResolvedValue({ data: [createAiModel()], error: null });
        gateway.listAiTools.mockResolvedValue({
            data: [createAiToolDto({ changesContent: true })],
            error: null
        });

        expect(gateway.listAiModels).not.toHaveBeenCalled();
        expect(gateway.listAiTools).not.toHaveBeenCalled();

        const models = await useCases.listAiModels();
        const tools = await useCases.listAiTools();

        expect(models).toEqual([createAiModel()]);
        expect(tools).toEqual([createAiTool({ changesContent: true })]);
        expect(gateway.listAiModels).toHaveBeenCalledTimes(1);
        expect(gateway.listAiTools).toHaveBeenCalledTimes(1);
    });

    it("returns an empty list as an empty list", async () => {
        gateway.listAiModels.mockResolvedValue({ data: [], error: null });

        expect(await useCases.listAiModels()).toEqual([]);
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigUseCases).inSingletonScope();

        expect(container.resolve(UseCasesAbstraction)).toBe(container.resolve(UseCasesAbstraction));
    });

    describe("error mapping (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotAuthorized,
                        message: "Not authorized.",
                        data: { action: "list" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotAuthorized,
                    message: "Not authorized.",
                    data: { action: "list" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws when the server answers with neither data nor error",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({ data: null, error: null });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                gateway[operationCase.method].mockRejectedValue(failure);

                await expect(operationCase.run(useCases)).rejects.toBe(failure);
            }
        );
    });
});
```

Create `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { EDITOR_AI_MODEL_FIELDS } from "./editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "./editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "./editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./WorkflowConfigGateway.js";
import { WorkflowConfigGateway } from "./WorkflowConfigGatewayImpl.js";

describe("WorkflowConfigGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WorkflowConfigGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("sends nothing until a method is called", () => {
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("lists the step types on the workflows root without variables", async () => {
        const envelope = { data: [{ type: "review" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listStepTypes: envelope } });

        const result = await gateway.listStepTypes();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("workflows");
        expect(request.query).toContain("listStepTypes");
        expect(request.query).toContain(EDITOR_STEP_TYPE_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
        expect(request.query).not.toContain("listAiModels");
    });

    it("lists the automation definitions without variables", async () => {
        const envelope = { data: [{ id: "automation-1" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAutomationDefinitions: envelope } });

        const result = await gateway.listAutomationDefinitions();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAutomationDefinitions");
        expect(request.query).toContain(EDITOR_AUTOMATION_DEFINITION_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("lists the notification transports without variables", async () => {
        const envelope = { data: [{ id: "e-mail" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listNotificationTransports: envelope } });

        const result = await gateway.listNotificationTransports();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listNotificationTransports");
        expect(request.query).toContain(EDITOR_NOTIFICATION_TRANSPORT_FIELDS);
    });

    it("lists the teams with search, ids and limit as variables", async () => {
        const envelope = { data: { teams: [], missingIds: ["team-9"] }, error: null };
        client.execute.mockResolvedValue({ workflows: { listTeams: envelope } });

        const result = await gateway.listTeams({ search: null, ids: ["team-9"], limit: null });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: ["team-9"], limit: null });
        expect(request.query).toContain(
            "listTeams(search: $search, ids: $ids, limit: $limit)"
        );
        expect(request.query).toContain(EDITOR_TEAM_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes a search and a limit of a team lookup through", async () => {
        client.execute.mockResolvedValue({
            workflows: { listTeams: { data: { teams: [], missingIds: [] }, error: null } }
        });

        await gateway.listTeams({ search: "ed", ids: null, limit: 20 });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: "ed", ids: null, limit: 20 });
    });

    it("lists the AI models only when asked", async () => {
        const envelope = { data: [{ id: "openai/gpt-4o" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAiModels: envelope } });

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiModels");
        expect(request.query).toContain(EDITOR_AI_MODEL_FIELDS);
    });

    it("lists the AI tools without variables", async () => {
        const envelope = { data: [{ name: "readContent", changesContent: false }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAiTools: envelope } });

        const result = await gateway.listAiTools();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiTools");
        expect(request.query).toContain(EDITOR_AI_TOOL_FIELDS);
        expect(request.query).toContain("changesContent");
    });

    it("returns an error envelope as it is and does not throw (R204)", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/NotAuthorized", message: "No.", data: null }
        };
        client.execute.mockResolvedValue({ workflows: { listAiModels: envelope } });

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope);
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.listStepTypes()).rejects.toBe(failure);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/useCases/toOperationError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts 2>&1 | tail -20
```

Expected: every test file fails with `Failed to resolve import` for the module it tests (`toOperationError.js`, `WorkflowEditorUseCases.js`, `WorkflowConfigUseCasesImpl.js`, `WorkflowConfigGatewayImpl.js`). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts`:

```ts
import type { EditorEnvelope } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";

export interface ListWorkflowModelsParams {
    // The model name filter; an empty string lists every model.
    search: string;
    limit: number;
    after: string | null;
}

export interface StoreWorkflowParams {
    data: EditorWorkflowInput;
    // The `savedOn` string the editor loaded, unchanged; `null` for a new workflow or Save as new.
    savedOn: string | null;
}

/*
 * The workflow operations one app exposes over its own GraphQL documents (R202). Every method
 * resolves with the shared envelope, also when the server reports an error, and rejects only on a
 * transport failure (R204). There is no abstraction token here: each app creates its own over this
 * interface.
 */
export interface IWorkflowEditorGateway {
    listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>;
    getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>;
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
}
```

Create `packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts`:

```ts
import type { AiToolDto } from "./dto.js";
import type { AutomationDefinitionDto } from "./dto.js";
import type { EditorEnvelope } from "./dto.js";
import type { EditorStepTypeDto } from "./dto.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

export interface ListTeamsParams {
    search: string | null;
    ids: string[] | null;
    limit: number | null;
}

/*
 * The editor's lookups on the shared `workflows` root. One implementation serves both apps. Every
 * method resolves with the envelope, also for a server error, and rejects only on a transport
 * failure (R204).
 */
export interface IWorkflowConfigGateway {
    listStepTypes(): Promise<EditorEnvelope<EditorStepTypeDto[]>>;
    listAutomationDefinitions(): Promise<EditorEnvelope<AutomationDefinitionDto[]>>;
    listNotificationTransports(): Promise<EditorEnvelope<NotificationTransport[]>>;
    listTeams(params: ListTeamsParams): Promise<EditorEnvelope<WorkflowTeamList>>;
    listAiModels(): Promise<EditorEnvelope<AiModel[]>>;
    listAiTools(): Promise<EditorEnvelope<AiToolDto[]>>;
}
```

Create `packages/app-workflows/src/editor/gateway/WorkflowConfigGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowConfigGateway } from "./IWorkflowConfigGateway.js";

export const WorkflowConfigGateway = createAbstraction<IWorkflowConfigGateway>(
    "Workflows/WorkflowConfigGateway"
);

export namespace WorkflowConfigGateway {
    export type Interface = IWorkflowConfigGateway;
}
```

Create `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { AiToolDto } from "./dto.js";
import type { AutomationDefinitionDto } from "./dto.js";
import type { EditorEnvelope } from "./dto.js";
import type { EditorStepTypeDto } from "./dto.js";
import type { WorkflowsOperationResponse } from "./dto.js";
import type { ListTeamsParams } from "./IWorkflowConfigGateway.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./WorkflowConfigGateway.js";
import { EDITOR_AI_MODEL_FIELDS } from "./editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "./editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "./editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";

const LIST_STEP_TYPES = /* GraphQL */ `
    query ListWorkflowStepTypes {
        workflows {
            listStepTypes {
                data {
                    ${EDITOR_STEP_TYPE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AUTOMATION_DEFINITIONS = /* GraphQL */ `
    query ListWorkflowAutomationDefinitions {
        workflows {
            listAutomationDefinitions {
                data {
                    ${EDITOR_AUTOMATION_DEFINITION_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_NOTIFICATION_TRANSPORTS = /* GraphQL */ `
    query ListWorkflowNotificationTransports {
        workflows {
            listNotificationTransports {
                data {
                    ${EDITOR_NOTIFICATION_TRANSPORT_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_TEAMS = /* GraphQL */ `
    query ListWorkflowTeams($search: String, $ids: [String!], $limit: Int) {
        workflows {
            listTeams(search: $search, ids: $ids, limit: $limit) {
                data {
                    ${EDITOR_TEAM_LIST_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AI_MODELS = /* GraphQL */ `
    query ListWorkflowAiModels {
        workflows {
            listAiModels {
                data {
                    ${EDITOR_AI_MODEL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AI_TOOLS = /* GraphQL */ `
    query ListWorkflowAiTools {
        workflows {
            listAiTools {
                data {
                    ${EDITOR_AI_TOOL_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/*
 * The lookups on the shared `workflows` root, one implementation for both apps. `listAiModels` is a
 * field of the AI Power-Ups extension: it exists only when that extension is registered, so it is
 * sent only when a caller asks for it (R275).
 */
class WorkflowConfigGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listStepTypes(): Promise<EditorEnvelope<EditorStepTypeDto[]>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listStepTypes", EditorEnvelope<EditorStepTypeDto[]>>
        >({
            query: LIST_STEP_TYPES
        });

        return response.workflows.listStepTypes;
    }

    async listAutomationDefinitions(): Promise<EditorEnvelope<AutomationDefinitionDto[]>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listAutomationDefinitions",
                EditorEnvelope<AutomationDefinitionDto[]>
            >
        >({
            query: LIST_AUTOMATION_DEFINITIONS
        });

        return response.workflows.listAutomationDefinitions;
    }

    async listNotificationTransports(): Promise<EditorEnvelope<NotificationTransport[]>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listNotificationTransports",
                EditorEnvelope<NotificationTransport[]>
            >
        >({
            query: LIST_NOTIFICATION_TRANSPORTS
        });

        return response.workflows.listNotificationTransports;
    }

    async listTeams(params: ListTeamsParams): Promise<EditorEnvelope<WorkflowTeamList>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listTeams", EditorEnvelope<WorkflowTeamList>>
        >({
            query: LIST_TEAMS,
            variables: { search: params.search, ids: params.ids, limit: params.limit }
        });

        return response.workflows.listTeams;
    }

    async listAiModels(): Promise<EditorEnvelope<AiModel[]>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiModels", EditorEnvelope<AiModel[]>>
        >({
            query: LIST_AI_MODELS
        });

        return response.workflows.listAiModels;
    }

    async listAiTools(): Promise<EditorEnvelope<AiToolDto[]>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiTools", EditorEnvelope<AiToolDto[]>>
        >({
            query: LIST_AI_TOOLS
        });

        return response.workflows.listAiTools;
    }
}

export const WorkflowConfigGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowConfigGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-workflows/src/editor/useCases/toOperationError.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";

const FALLBACK_MESSAGE = "The request failed.";

/*
 * The error a use case throws for an envelope that carries an error, or neither data nor error
 * (R204): the server's message, code and data, with a fallback message.
 */
export const toOperationError = (error: EditorErrorDto | null): GraphQLOperationError => {
    return new GraphQLOperationError({
        message: error?.message ?? FALLBACK_MESSAGE,
        code: error?.code ?? null,
        data: error?.data ?? null
    });
};
```

Create `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts`:

```ts
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

/*
 * What the editor needs from one app. Every method throws a `GraphQLOperationError` for a server
 * error (its `code` is a `WorkflowErrorCode`) or the transport `Error` as is (R204).
 */
export interface IWorkflowEditorUseCases {
    listModels(params: ListWorkflowModelsParams): Promise<WorkflowModelPage>;
    getWorkflow(id: string): Promise<EditorWorkflow>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorWorkflow>;
    // Resolves with the deleted workflow.
    deleteWorkflow(id: string): Promise<EditorWorkflow>;
}
```

Create `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`:

```ts
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
import { toOperationError } from "./toOperationError.js";

/*
 * The one shared implementation of the editor use cases (R202). It runs the app's gateway, maps
 * the DTOs, turns an error envelope into a thrown `GraphQLOperationError` (R204) and lets transport
 * errors pass. It is exported plain: `createImplementation` writes the abstraction and the
 * dependencies on the class, so each app binds its own subclass (R237).
 */
export class WorkflowEditorUseCases implements IWorkflowEditorUseCases {
    constructor(private gateway: IWorkflowEditorGateway) {}

    public async listModels(params: ListWorkflowModelsParams): Promise<WorkflowModelPage> {
        const envelope = await this.gateway.listModels(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowModelPage(envelope.data);
    }

    public async getWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.getWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }

    public async storeWorkflow(params: StoreWorkflowParams): Promise<EditorWorkflow> {
        const envelope = await this.gateway.storeWorkflow(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }

    public async deleteWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.deleteWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }
}
```

Create `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts`:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

/*
 * The editor's lookups. Every method throws a `GraphQLOperationError` for a server error or the
 * transport `Error` as is (R204). `listAiModels` and `listAiTools` are called only when the AI step
 * type is available and has a config schema (R275).
 */
export interface IWorkflowConfigUseCases {
    listStepTypes(): Promise<EditorStepType[]>;
    listAutomationDefinitions(): Promise<AutomationDefinition[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiTool[]>;
}
```

Create `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowConfigUseCases } from "./IWorkflowConfigUseCases.js";

export const WorkflowConfigUseCases = createAbstraction<IWorkflowConfigUseCases>(
    "Workflows/WorkflowConfigUseCases"
);

export namespace WorkflowConfigUseCases {
    export type Interface = IWorkflowConfigUseCases;
}
```

Create `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.ts`:

```ts
import { WorkflowConfigGateway } from "~/editor/gateway/WorkflowConfigGateway.js";
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./WorkflowConfigUseCases.js";
import { toOperationError } from "./toOperationError.js";

/*
 * One implementation for both apps: the lookups are on the shared `workflows` root and the gateway
 * is bound once, so unlike `WorkflowEditorUseCases` this class is not subclassed (R237 concerns a
 * class bound under more than one token).
 */
class WorkflowConfigUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(private gateway: WorkflowConfigGateway.Interface) {}

    public async listStepTypes(): Promise<EditorStepType[]> {
        const envelope = await this.gateway.listStepTypes();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapEditorStepType);
    }

    public async listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        const envelope = await this.gateway.listAutomationDefinitions();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapAutomationDefinition);
    }

    public async listNotificationTransports(): Promise<NotificationTransport[]> {
        const envelope = await this.gateway.listNotificationTransports();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        const envelope = await this.gateway.listTeams(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listAiModels(): Promise<AiModel[]> {
        const envelope = await this.gateway.listAiModels();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    public async listAiTools(): Promise<AiTool[]> {
        const envelope = await this.gateway.listAiTools();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data.map(mapAiTool);
    }
}

export const WorkflowConfigUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowConfigUseCasesImpl,
    dependencies: [WorkflowConfigGateway]
});
```

Create `packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorUseCases extends IWorkflowEditorUseCases {
    listModels: Mock<IWorkflowEditorUseCases["listModels"]>;
    getWorkflow: Mock<IWorkflowEditorUseCases["getWorkflow"]>;
    storeWorkflow: Mock<IWorkflowEditorUseCases["storeWorkflow"]>;
    deleteWorkflow: Mock<IWorkflowEditorUseCases["deleteWorkflow"]>;
}

/*
 * Fake editor use cases with sensible defaults: one model row with a bound workflow, and every
 * read, store and delete resolves the default workflow. Tests override single methods with
 * `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeEditorUseCases = (): FakeWorkflowEditorUseCases => {
    const workflow = createEditorWorkflow();
    const page = createWorkflowModelPage();
    return {
        listModels: vi.fn().mockResolvedValue(page),
        getWorkflow: vi.fn().mockResolvedValue(workflow),
        storeWorkflow: vi.fn().mockResolvedValue(workflow),
        deleteWorkflow: vi.fn().mockResolvedValue(workflow)
    };
};
```

Create `packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowConfigUseCases } from "~/editor/useCases/IWorkflowConfigUseCases.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowConfigUseCases extends IWorkflowConfigUseCases {
    listStepTypes: Mock<IWorkflowConfigUseCases["listStepTypes"]>;
    listAutomationDefinitions: Mock<IWorkflowConfigUseCases["listAutomationDefinitions"]>;
    listNotificationTransports: Mock<IWorkflowConfigUseCases["listNotificationTransports"]>;
    listTeams: Mock<IWorkflowConfigUseCases["listTeams"]>;
    listAiModels: Mock<IWorkflowConfigUseCases["listAiModels"]>;
    listAiTools: Mock<IWorkflowConfigUseCases["listAiTools"]>;
}

/*
 * Fake config use cases with sensible defaults: the three step types, all available and without a
 * config schema, no automation, the e-mail transport, no team, no AI model and no AI tool.
 */
export const createFakeConfigUseCases = (): FakeWorkflowConfigUseCases => {
    const stepTypes = [
        createEditorStepType({ type: "review", title: "Review" }),
        createEditorStepType({ type: "automation", title: "Automation" }),
        createEditorStepType({ type: "ai", title: "AI" })
    ];
    return {
        listStepTypes: vi.fn().mockResolvedValue(stepTypes),
        listAutomationDefinitions: vi.fn().mockResolvedValue([]),
        listNotificationTransports: vi.fn().mockResolvedValue([createNotificationTransport()]),
        listTeams: vi.fn().mockResolvedValue({ teams: [], missingIds: [] }),
        listAiModels: vi.fn().mockResolvedValue([]),
        listAiTools: vi.fn().mockResolvedValue([])
    };
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/useCases/toOperationError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/domain/WorkflowErrorCode.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/mapEditorWorkflow.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
```
```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
git commit -m "feat(app-workflows): add the workflow editor gateways and use cases" -m "The editor gets its gateway and use-case interfaces, the shared WorkflowEditorUseCases (a plain class each app subclasses), the shared config gateway and use cases over the workflows root, and the vitest fakes. An error envelope becomes a GraphQLOperationError that keeps code and data, and savedOn is passed through as the exact string." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`listTeams` and `listAiModels` documents:** `listTeams` follows R268 and Task 2 (`workflows { listTeams(search, ids, limit) }` answering `data { teams { id name memberCount } missingIds } error`; verified against `9a.1-api/task-02-list-teams.md`). `listAiModels` follows `research2-api.md` C (an `ai-powerups` field of `WorkflowsQuery`).
- **`listAiModels` only when called:** the field exists only when the `ai-powerups` extension is registered, so sending it unasked would fail the whole query on a server without it (R275).
- **Documents inline:** the config gateway's documents are unexported constants of `WorkflowConfigGatewayImpl.ts`, not separate files; the selections they use are Task 5's `editorFields.ts`.
- **`toOperationError.ts`** is beyond the contract's file list (one exported function per file, shared by both use-case classes).
