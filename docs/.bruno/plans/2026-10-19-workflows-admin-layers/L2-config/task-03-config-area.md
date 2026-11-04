### Task 3: Config area: gateway, repository, seven use cases

R343, R344, R345, R346, R348 (#3-#9), R354, R355, R356, R360, R364; 9b R275; Q71, Q72, Q75, Q76; Review Focus 1, 6. The config lookups move from `[AWE]` to their own area `[AWC]` = `packages/app-workflows/src/config/`. The gateway now unwraps the envelope and throws; a repository maps the DTOs; one use case per lookup; the old bundle delegates to the use cases until Task 14.

- **Gateway (R346):** `[AWE]/gateway/{IWorkflowConfigGateway.ts, abstractions.ts, WorkflowConfigGateway.ts, WorkflowConfigGateway.test.ts}` move to `[AWC]/gateway/` (`git mv`, history kept). The token stays `"Workflows/WorkflowConfigGateway"` and the export stays `WorkflowConfigGateway`. Every method returns the DTO (`envelope.data`) instead of the envelope and runs `if (envelope.error || !envelope.data) { throw toOperationError(envelope.error); }` inline (`toOperationError` from `~/gateway/toOperationError.js`, Task 1). A transport rejection of `MainGraphQLClient.execute` passes as it is. Documents, variables and field selections are unchanged character for character; `listAiModels` is still a separate document sent only when asked (R275). The DTO file, the field fragments and the mappers stay in `[AWE]/gateway/` (R344); the moved files import them by `~/editor/gateway/...`.
- **Repository (R343):** `WorkflowConfigRepository` (`"Workflows/WorkflowConfigRepository"`, singleton) with the seven methods of the gateway, returning domain types: `listStepTypes` maps with `mapEditorStepType`, `listAutomationDefinitions` with `mapAutomationDefinition`, `listUsers` with `mapWorkflowUserList`, `listAiTools` with `mapAiTool`; `listNotificationTransports`, `listTeams` and `listAiModels` return the DTO as it is (DTO = domain, inventory 1.3). No cache, no catch. `listTeams` and `listUsers` take `ListWorkflowTeamsUseCase.Params` / `ListWorkflowUsersUseCase.Params` (R345, type-only imports). `WorkflowConfigRepositoryFeature` (`"Workflows/WorkflowConfigRepository"`, no `resolve`) registers the gateway and the repository as singletons (the Dashboard form).
- **Use cases (R344, R348 #3-#9, R360):** `ListStepTypesUseCase`, `ListAutomationDefinitionsUseCase`, `ListNotificationTransportsUseCase`, `ListWorkflowTeamsUseCase` (`Params = ListTeamsParams`), `ListWorkflowUsersUseCase` (`Params = ListUsersParams`), `ListAiModelsUseCase`, `ListAiToolsUseCase`, each in `[AWC]/useCases/<folder>/` with `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `<Name>UseCase.test.ts`. One `execute`, transient, depends on `WorkflowConfigRepository` only, calls one repository method and returns its value. Each feature is `<Name>Feature` named `"Workflows/<Name>"` (without `UseCase`), registers the use case transient and resolves `{ useCase }`.
- **Composite (R354):** `WorkflowConfigServicesFeature` (`[AWC]/feature.ts`, `"Workflows/WorkflowConfigServices"`, no `resolve`) registers `WorkflowConfigRepositoryFeature` and the seven use-case features. `[AW]/app.tsx` registers it inside the `advancedPublishingWorkflow` gate, before `WorkflowEditorServicesFeature`.
- **Bridge (R356, R364):** `[AWE]/useCases/WorkflowConfigUseCases.ts` is rewritten: the class keeps its token and its seven methods, now injects the seven use cases and calls one `execute` per method. `WorkflowEditorServicesFeature` stops registering the config gateway and keeps registering the bridge and resolving `{ configUseCases, toasts }`. The bridge has no test of its own; `WorkflowConfigUseCases.test.ts` is deleted after its cases are ported: the mapping cases to the use-case tests, the error-mapping cases to the gateway test; its "is a singleton" case has no successor (use cases are transient, R344; the repository and gateway singletons are asserted in `[AWC]/feature.test.ts` and `[AW]/app.test.tsx`).
- **Type homes (R345):** `ListTeamsParams` and `ListUsersParams` stay declared in the moved `IWorkflowConfigGateway.ts`; `IWorkflowConfigUseCases.ts` and the bridge import them from `~/config/gateway/IWorkflowConfigGateway.js`; the settings test that typed a lookup with `ListUsersParams` uses `ListWorkflowUsersUseCase.Params`.

**Files:**
- Move (`git mv`): `packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts` → `packages/app-workflows/src/config/gateway/IWorkflowConfigGateway.ts` (then modified)
- Move (`git mv`): `packages/app-workflows/src/editor/gateway/abstractions.ts` → `packages/app-workflows/src/config/gateway/abstractions.ts` (content unchanged)
- Move (`git mv`): `packages/app-workflows/src/editor/gateway/WorkflowConfigGateway.ts` → `packages/app-workflows/src/config/gateway/WorkflowConfigGateway.ts` (then rewritten)
- Move (`git mv`): `packages/app-workflows/src/editor/gateway/WorkflowConfigGateway.test.ts` → `packages/app-workflows/src/config/gateway/WorkflowConfigGateway.test.ts` (then rewritten)
- Create: `packages/app-workflows/src/config/testing/fakeWorkflowConfigGateway.ts`
- Create: `packages/app-workflows/src/config/repository/abstractions.ts`
- Create: `packages/app-workflows/src/config/repository/WorkflowConfigRepository.ts`
- Create: `packages/app-workflows/src/config/repository/feature.ts`
- Create: `packages/app-workflows/src/config/useCases/listStepTypes/{abstractions.ts, ListStepTypesUseCase.ts, feature.ts, ListStepTypesUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listAutomationDefinitions/{abstractions.ts, ListAutomationDefinitionsUseCase.ts, feature.ts, ListAutomationDefinitionsUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listNotificationTransports/{abstractions.ts, ListNotificationTransportsUseCase.ts, feature.ts, ListNotificationTransportsUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listWorkflowTeams/{abstractions.ts, ListWorkflowTeamsUseCase.ts, feature.ts, ListWorkflowTeamsUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listWorkflowUsers/{abstractions.ts, ListWorkflowUsersUseCase.ts, feature.ts, ListWorkflowUsersUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listAiModels/{abstractions.ts, ListAiModelsUseCase.ts, feature.ts, ListAiModelsUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/useCases/listAiTools/{abstractions.ts, ListAiToolsUseCase.ts, feature.ts, ListAiToolsUseCase.test.ts}`
- Create: `packages/app-workflows/src/config/feature.ts`
- Create: `packages/app-workflows/src/config/feature.test.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts` (bridge, full rewrite)
- Modify: `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts` (import path)
- Modify: `packages/app-workflows/src/editor/feature.ts`
- Modify: `packages/app-workflows/src/editor/feature.test.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts` (one type import)
- Delete: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.test.ts`

**Interfaces:**
- Consumes: Task 1 (`toOperationError(error: EditorErrorDto | null): GraphQLOperationError` at `packages/app-workflows/src/gateway/toOperationError.ts`; `KEPT_PATHS` in `app.cleanup.test.tsx` already holds `"gateway"`). Existing, verified at HEAD with codegraph: `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`), `GraphQLOperationError` (`@webiny/app/errors/index.js`, `{ message; code?; data? }`), `createAbstraction` / `createFeature` (`@webiny/feature/admin`), `Container` (`@webiny/di`, `registerInstance<T>(abstraction, instance: T)`), `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`), `EDITOR_*_FIELDS` (`~/editor/gateway/editorFields.js`), `EditorEnvelope`, `WorkflowsOperationResponse`, `EditorStepTypeDto`, `AutomationDefinitionDto`, `WorkflowUserListDto`, `AiToolDto` (`~/editor/gateway/dto.js`), `mapEditorStepType`, `mapAutomationDefinition`, `mapWorkflowUserList`, `mapAiTool` (`~/editor/gateway/map*.js`), the domain types `EditorStepType`, `AutomationDefinition`, `NotificationTransport`, `WorkflowTeamList`, `WorkflowUserList`, `AiModel`, `AiTool` (`~/editor/domain/types.js`), `WorkflowErrorCode.NotAuthorized` (`~/editor/domain/WorkflowErrorCode.js`), the fixtures `createEditorStepTypeDto`, `createAutomationDefinitionDto`, `createNotificationTransport`, `createWorkflowTeamSummary`, `createWorkflowUserDto`, `createWorkflowUserListDto`, `createWorkflowUserSummary`, `createAiModel`, `createAiTool`, `createAiToolDto` (`~/editor/testing/editorFixtures.js`), `WorkflowEditorToasts` (`~/editor/toasts/`), `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`).
- Produces:
  - `WorkflowConfigGateway` (`[AWC]/gateway/abstractions.ts`, token `"Workflows/WorkflowConfigGateway"`), `IWorkflowConfigGateway { listStepTypes(): Promise<EditorStepTypeDto[]>; listAutomationDefinitions(): Promise<AutomationDefinitionDto[]>; listNotificationTransports(): Promise<NotificationTransport[]>; listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>; listUsers(params: ListUsersParams): Promise<WorkflowUserListDto>; listAiModels(): Promise<AiModel[]>; listAiTools(): Promise<AiToolDto[]> }`, `ListTeamsParams`, `ListUsersParams` (`[AWC]/gateway/IWorkflowConfigGateway.ts`).
  - `WorkflowConfigRepository` (`[AWC]/repository/abstractions.ts`, `"Workflows/WorkflowConfigRepository"`), `IWorkflowConfigRepository` (the seven methods, domain return types), `WorkflowConfigRepositoryFeature` (`[AWC]/repository/feature.ts`).
  - Seven use cases (`[AWC]/useCases/<folder>/abstractions.ts`): `ListStepTypesUseCase` (`execute(): Promise<EditorStepType[]>`), `ListAutomationDefinitionsUseCase` (`AutomationDefinition[]`), `ListNotificationTransportsUseCase` (`NotificationTransport[]`), `ListWorkflowTeamsUseCase` (`execute(params: ListWorkflowTeamsUseCase.Params): Promise<WorkflowTeamList>`, `Params = ListTeamsParams`), `ListWorkflowUsersUseCase` (`execute(params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList>`, `Params = ListUsersParams`), `ListAiModelsUseCase` (`AiModel[]`), `ListAiToolsUseCase` (`AiTool[]`); tokens `"Workflows/<Name>UseCase"`; features `ListStepTypesFeature`, `ListAutomationDefinitionsFeature`, `ListNotificationTransportsFeature`, `ListWorkflowTeamsFeature`, `ListWorkflowUsersFeature`, `ListAiModelsFeature`, `ListAiToolsFeature` (`"Workflows/<Name>"`, `resolve` → `{ useCase }`).
  - `WorkflowConfigServicesFeature` (`[AWC]/feature.ts`, `"Workflows/WorkflowConfigServices"`).
  - `createFakeConfigGateway(): FakeWorkflowConfigGateway` (`[AWC]/testing/fakeWorkflowConfigGateway.ts`; every method a bare `vi.fn()`).
  - The bridge `WorkflowConfigUseCases` (unchanged token and interface, deps the seven use cases; Task 4 removes its last injector, Task 14 deletes it).

**Test runner note:** admin package: `yarn test <path>` only, one file per command, never `test:os`, never a whole package. The type check of co-located tests is `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30` (8a R243).

- [ ] **Step 1: Move the gateway files and write the failing tests**

Move the four files (content unchanged in this step):

```bash
mkdir -p packages/app-workflows/src/config/gateway
git mv packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts packages/app-workflows/src/config/gateway/IWorkflowConfigGateway.ts
git mv packages/app-workflows/src/editor/gateway/abstractions.ts packages/app-workflows/src/config/gateway/abstractions.ts
git mv packages/app-workflows/src/editor/gateway/WorkflowConfigGateway.ts packages/app-workflows/src/config/gateway/WorkflowConfigGateway.ts
git mv packages/app-workflows/src/editor/gateway/WorkflowConfigGateway.test.ts packages/app-workflows/src/config/gateway/WorkflowConfigGateway.test.ts
```

`packages/app-workflows/src/config/gateway/abstractions.ts` keeps its content exactly (it imports `./IWorkflowConfigGateway.js`, which moved with it):

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

Create the fake gateway the use-case tests run the real repository over, `packages/app-workflows/src/config/testing/fakeWorkflowConfigGateway.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";

export interface FakeWorkflowConfigGateway extends WorkflowConfigGateway.Interface {
    listStepTypes: Mock<WorkflowConfigGateway.Interface["listStepTypes"]>;
    listAutomationDefinitions: Mock<WorkflowConfigGateway.Interface["listAutomationDefinitions"]>;
    listNotificationTransports: Mock<WorkflowConfigGateway.Interface["listNotificationTransports"]>;
    listTeams: Mock<WorkflowConfigGateway.Interface["listTeams"]>;
    listUsers: Mock<WorkflowConfigGateway.Interface["listUsers"]>;
    listAiModels: Mock<WorkflowConfigGateway.Interface["listAiModels"]>;
    listAiTools: Mock<WorkflowConfigGateway.Interface["listAiTools"]>;
}

/*
 * A config gateway for the use-case tests (R355): the real repository runs over it. Every method
 * answers nothing until a test sets it, so a test names exactly the DTOs it expects to be mapped.
 */
export const createFakeConfigGateway = (): FakeWorkflowConfigGateway => {
    return {
        listStepTypes: vi.fn(),
        listAutomationDefinitions: vi.fn(),
        listNotificationTransports: vi.fn(),
        listTeams: vi.fn(),
        listUsers: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};
```

Replace `packages/app-workflows/src/config/gateway/WorkflowConfigGateway.test.ts` with (every document and variable assertion of the old test is kept; the two R204 "returns the envelope" cases become the R346 throw cases, and the throw cases run for all seven operations):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { EDITOR_AI_MODEL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowConfigGateway } from "./WorkflowConfigGateway.js";

interface OperationCase {
    // The method name, which is also the field on the `workflows` root.
    name: string;
    run: (gateway: GatewayAbstraction.Interface) => Promise<unknown>;
}

interface WorkflowsResponse {
    workflows: Record<string, unknown>;
}

const respond = (field: string, envelope: unknown): WorkflowsResponse => {
    return { workflows: { [field]: envelope } };
};

const operationCases: OperationCase[] = [
    { name: "listStepTypes", run: gateway => gateway.listStepTypes() },
    { name: "listAutomationDefinitions", run: gateway => gateway.listAutomationDefinitions() },
    { name: "listNotificationTransports", run: gateway => gateway.listNotificationTransports() },
    {
        name: "listTeams",
        run: gateway => gateway.listTeams({ search: null, ids: null, limit: null })
    },
    {
        name: "listUsers",
        run: gateway => gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null })
    },
    { name: "listAiModels", run: gateway => gateway.listAiModels() },
    { name: "listAiTools", run: gateway => gateway.listAiTools() }
];

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

    it("lists the step types on the workflows root without variables and returns the data", async () => {
        const envelope = { data: [{ type: "review" }], error: null };
        const response = respond("listStepTypes", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listStepTypes();

        expect(result).toEqual(envelope.data);
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
        const response = respond("listAutomationDefinitions", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAutomationDefinitions();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAutomationDefinitions");
        expect(request.query).toContain(EDITOR_AUTOMATION_DEFINITION_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("lists the notification transports without variables", async () => {
        const envelope = { data: [{ id: "e-mail" }], error: null };
        const response = respond("listNotificationTransports", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listNotificationTransports();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listNotificationTransports");
        expect(request.query).toContain(EDITOR_NOTIFICATION_TRANSPORT_FIELDS);
    });

    it("lists the teams with search, ids and limit as variables", async () => {
        const envelope = { data: { teams: [], missingIds: ["team-9"] }, error: null };
        const response = respond("listTeams", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listTeams({ search: null, ids: ["team-9"], limit: null });

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: ["team-9"], limit: null });
        expect(request.query).toContain("listTeams(search: $search, ids: $ids, limit: $limit)");
        expect(request.query).toContain(EDITOR_TEAM_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes a search and a limit of a team lookup through", async () => {
        const envelope = { data: { teams: [], missingIds: [] }, error: null };
        const response = respond("listTeams", envelope);
        client.execute.mockResolvedValue(response);

        await gateway.listTeams({ search: "ed", ids: null, limit: 20 });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: "ed", ids: null, limit: 20 });
    });

    it("lists the users with search, ids, team ids and limit as variables", async () => {
        const envelope = {
            data: {
                users: [{ id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] }],
                missingIds: ["user-9"]
            },
            error: null
        };
        const response = respond("listUsers", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listUsers({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });

        expect(result).toEqual(envelope.data);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });
        expect(request.query).toContain("workflows");
        expect(request.query).toContain(
            "listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit)"
        );
        expect(request.query).toContain(EDITOR_USER_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("sends null for every variable a user lookup does not set", async () => {
        const envelope = { data: { users: [], missingIds: [] }, error: null };
        const response = respond("listUsers", envelope);
        client.execute.mockResolvedValue(response);

        await gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: null, teamIds: null, limit: null });
    });

    it("lists the AI models only when asked (R275)", async () => {
        const envelope = { data: [{ id: "openai/gpt-4o" }], error: null };
        const response = respond("listAiModels", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope.data);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiModels");
        expect(request.query).toContain(EDITOR_AI_MODEL_FIELDS);
    });

    it("lists the AI tools without variables", async () => {
        const envelope = { data: [{ name: "readContent", changesContent: false }], error: null };
        const response = respond("listAiTools", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiTools();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiTools");
        expect(request.query).toContain(EDITOR_AI_TOOL_FIELDS);
        expect(request.query).toContain("changesContent");
    });

    it("returns an empty list as a value, not as missing data", async () => {
        const response = respond("listAiModels", { data: [], error: null });
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiModels();

        expect(result).toEqual([]);
    });

    it("uses the fallback message and keeps the code of an error without a message", async () => {
        const error = { code: WorkflowErrorCode.NotAuthorized, message: null, data: null };
        const response = respond("listUsers", { data: null, error });
        client.execute.mockResolvedValue(response);

        const promise = gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            message: "The request failed.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
    });

    describe("errors (R346)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError with the message, code and data of an error envelope",
            async operationCase => {
                const error = {
                    code: WorkflowErrorCode.NotAuthorized,
                    message: "Not authorized.",
                    data: { action: "list" }
                };
                const response = respond(operationCase.name, { data: null, error });
                client.execute.mockResolvedValue(response);

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "Not authorized.",
                    code: WorkflowErrorCode.NotAuthorized,
                    data: { action: "list" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback error when the server answers with neither data nor error",
            async operationCase => {
                const response = respond(operationCase.name, { data: null, error: null });
                client.execute.mockResolvedValue(response);

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null,
                    data: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                client.execute.mockRejectedValue(failure);

                await expect(operationCase.run(gateway)).rejects.toBe(failure);
            }
        );
    });
});
```

Create the seven use-case tests. Each runs the real use case and the real repository over `createFakeConfigGateway()` (R355, the WB `DeletePageRevision.test.ts` form); the mapping assertions are the ported cases of `WorkflowConfigUseCases.test.ts`.

`packages/app-workflows/src/config/useCases/listStepTypes/ListStepTypesUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepTypesUseCase } from "./ListStepTypesUseCase.js";

describe("ListStepTypesUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListStepTypesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the step types in the order the server returns them and narrows the schema", async () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        gateway.listStepTypes.mockResolvedValue([
            createEditorStepTypeDto({ type: "ai", title: "AI", configSchema: null }),
            createEditorStepTypeDto({ type: "review", configSchema }),
            createEditorStepTypeDto({
                type: "automation",
                available: false,
                unavailableReason: "No automations are available."
            })
        ]);

        const stepTypes = await useCase.execute();

        expect(gateway.listStepTypes).toHaveBeenCalledTimes(1);
        expect(stepTypes.map(stepType => stepType.type)).toEqual(["ai", "review", "automation"]);
        expect(stepTypes[1].configSchema).toBe(configSchema);
        expect(stepTypes[0].configSchema).toBeNull();
        expect(stepTypes[2].unavailableReason).toBe("No automations are available.");
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listStepTypes.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listAutomationDefinitions/ListAutomationDefinitionsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

describe("ListAutomationDefinitionsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAutomationDefinitionsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the automation definitions and narrows the settings schema", async () => {
        const settingsSchema = { type: "object", properties: { timeout: { type: "number" } } };
        gateway.listAutomationDefinitions.mockResolvedValue([
            createAutomationDefinitionDto({ id: "automation-1", settingsSchema }),
            createAutomationDefinitionDto({ id: "automation-2", settingsSchema: null })
        ]);

        const definitions = await useCase.execute();

        expect(gateway.listAutomationDefinitions).toHaveBeenCalledTimes(1);
        expect(definitions.map(definition => definition.id)).toEqual([
            "automation-1",
            "automation-2"
        ]);
        expect(definitions[0].settingsSchema).toBe(settingsSchema);
        expect(definitions[1].settingsSchema).toBeNull();
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAutomationDefinitions.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listNotificationTransports/ListNotificationTransportsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";

describe("ListNotificationTransportsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListNotificationTransportsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the notification transports as they are", async () => {
        const transports = [
            createNotificationTransport(),
            createNotificationTransport({ id: "slack", title: "Slack", description: "Posts." })
        ];
        gateway.listNotificationTransports.mockResolvedValue(transports);

        const result = await useCase.execute();

        expect(gateway.listNotificationTransports).toHaveBeenCalledTimes(1);
        expect(result).toEqual(transports);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listNotificationTransports.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listWorkflowTeams/ListWorkflowTeamsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

const teamParams: UseCaseAbstraction.Params = { search: "ed", ids: null, limit: 20 };

describe("ListWorkflowTeamsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListWorkflowTeamsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the teams with the params passed through and the missing ids", async () => {
        gateway.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ memberCount: 0 })],
            missingIds: ["team-gone"]
        });

        const result = await useCase.execute(teamParams);

        expect(gateway.listTeams).toHaveBeenCalledTimes(1);
        expect(gateway.listTeams).toHaveBeenCalledWith(teamParams);
        expect(result.teams[0].memberCount).toBe(0);
        expect(result.missingIds).toEqual(["team-gone"]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listTeams.mockRejectedValue(error);

        await expect(useCase.execute(teamParams)).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listWorkflowUsers/ListWorkflowUsersUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

const userParams: UseCaseAbstraction.Params = {
    search: "iv",
    ids: null,
    teamIds: ["team-1"],
    limit: 20
};

describe("ListWorkflowUsersUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListWorkflowUsersUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the users with the params passed through, the team ids and the missing ids", async () => {
        gateway.listUsers.mockResolvedValue(
            createWorkflowUserListDto({
                users: [
                    createWorkflowUserDto({ id: "user-1", teamIds: ["team-1", "team-2"] }),
                    createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
                ],
                missingIds: ["user-gone"]
            })
        );

        const result = await useCase.execute(userParams);

        expect(gateway.listUsers).toHaveBeenCalledTimes(1);
        expect(gateway.listUsers).toHaveBeenCalledWith(userParams);
        expect(result.users).toEqual([
            createWorkflowUserSummary({ id: "user-1", teamIds: ["team-1", "team-2"] }),
            createWorkflowUserSummary({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
        ]);
        expect(result.missingIds).toEqual(["user-gone"]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listUsers.mockRejectedValue(error);

        await expect(useCase.execute(userParams)).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listAiModels/ListAiModelsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiModelsUseCase } from "./ListAiModelsUseCase.js";

describe("ListAiModelsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAiModelsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("asks for the AI models only when called and returns them as they are (R275)", async () => {
        gateway.listAiModels.mockResolvedValue([createAiModel()]);

        expect(gateway.listAiModels).not.toHaveBeenCalled();

        const models = await useCase.execute();

        expect(models).toEqual([createAiModel()]);
        expect(gateway.listAiModels).toHaveBeenCalledTimes(1);
    });

    it("returns an empty list as an empty list", async () => {
        gateway.listAiModels.mockResolvedValue([]);

        expect(await useCase.execute()).toEqual([]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAiModels.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
```

`packages/app-workflows/src/config/useCases/listAiTools/ListAiToolsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiToolsUseCase } from "./ListAiToolsUseCase.js";

describe("ListAiToolsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAiToolsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("asks for the AI tools only when called and maps them with changesContent (R275)", async () => {
        gateway.listAiTools.mockResolvedValue([createAiToolDto({ changesContent: true })]);

        expect(gateway.listAiTools).not.toHaveBeenCalled();

        const tools = await useCase.execute();

        expect(tools).toEqual([createAiTool({ changesContent: true })]);
        expect(gateway.listAiTools).toHaveBeenCalledTimes(1);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAiTools.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
```

Create `packages/app-workflows/src/config/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowConfigServicesFeature } from "./feature.js";
import { WorkflowConfigGateway } from "./gateway/abstractions.js";
import { WorkflowConfigRepository } from "./repository/abstractions.js";
import { ListAiModelsUseCase } from "./useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "./useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "./useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "./useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "./useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "./useCases/listWorkflowUsers/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    return container;
};

describe("WorkflowConfigServicesFeature", () => {
    it("registers the config gateway and the config repository as singletons", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
        expect(container.resolve(WorkflowConfigRepository)).toBeDefined();
        expect(container.resolve(WorkflowConfigRepository)).toBe(
            container.resolve(WorkflowConfigRepository)
        );
    });

    it("registers the seven config use cases transient (R344)", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);

        expect(container.resolve(ListStepTypesUseCase)).not.toBe(
            container.resolve(ListStepTypesUseCase)
        );
        expect(container.resolve(ListAutomationDefinitionsUseCase)).not.toBe(
            container.resolve(ListAutomationDefinitionsUseCase)
        );
        expect(container.resolve(ListNotificationTransportsUseCase)).not.toBe(
            container.resolve(ListNotificationTransportsUseCase)
        );
        expect(container.resolve(ListWorkflowTeamsUseCase)).not.toBe(
            container.resolve(ListWorkflowTeamsUseCase)
        );
        expect(container.resolve(ListWorkflowUsersUseCase)).not.toBe(
            container.resolve(ListWorkflowUsersUseCase)
        );
        expect(container.resolve(ListAiModelsUseCase)).not.toBe(
            container.resolve(ListAiModelsUseCase)
        );
        expect(container.resolve(ListAiToolsUseCase)).not.toBe(
            container.resolve(ListAiToolsUseCase)
        );
    });

    it("sends nothing on registration and resolution (R275)", () => {
        const execute = vi.fn();
        const container = createContainer(execute);
        WorkflowConfigServicesFeature.register(container);

        container.resolve(ListAiModelsUseCase);
        container.resolve(ListStepTypesUseCase);

        expect(execute).not.toHaveBeenCalled();
    });

    it("runs a use case over the real repository and gateway", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                listNotificationTransports: {
                    data: [{ id: "e-mail", title: "E-mail", description: null }],
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowConfigServicesFeature.register(container);
        const useCase = container.resolve(ListNotificationTransportsUseCase);

        const transports = await useCase.execute();

        expect(transports).toEqual([{ id: "e-mail", title: "E-mail", description: null }]);
        expect(execute).toHaveBeenCalledTimes(1);
    });
});
```

Replace `packages/app-workflows/src/editor/feature.test.ts` with (R364: the gateway token comes from its new place, `WorkflowConfigServicesFeature` is registered beside the editor services because the bridge runs on the config use cases; the "is the bridge still resolved" cases stay until Task 14):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowConfigServicesFeature } from "~/config/feature.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowEditorServicesFeature } from "./feature.js";
import { WorkflowConfigUseCases } from "./useCases/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("WorkflowEditorServicesFeature", () => {
    it("registers the config bridge and the toasts", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);
        WorkflowEditorServicesFeature.register(container);

        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
        expect(container.resolve(WorkflowEditorToasts)).toBeDefined();
    });

    it("no longer registers the config gateway itself (R354)", () => {
        const container = createContainer();
        WorkflowEditorServicesFeature.register(container);

        expect(() => container.resolve(WorkflowConfigGateway)).toThrow();
    });

    it("registers them as singletons and resolves them (R364)", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);
        WorkflowEditorServicesFeature.register(container);

        const first = WorkflowEditorServicesFeature.resolve(container);
        const second = WorkflowEditorServicesFeature.resolve(container);

        expect(first.configUseCases).toBe(second.configUseCases);
        expect(first.toasts).toBe(second.toasts);
        expect(first.configUseCases).toBe(container.resolve(WorkflowConfigUseCases));
    });

    it("runs the config bridge over the config use cases and the shared gateway", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                listNotificationTransports: {
                    data: [{ id: "e-mail", title: "E-mail", description: null }],
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowConfigServicesFeature.register(container);
        WorkflowEditorServicesFeature.register(container);
        const { configUseCases } = WorkflowEditorServicesFeature.resolve(container);

        const transports = await configUseCases.listNotificationTransports();

        expect(transports).toEqual([{ id: "e-mail", title: "E-mail", description: null }]);
        expect(execute).toHaveBeenCalledTimes(1);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add these imports after the last import line (`import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";`; if Task 1 added imports after it, add them after Task 1's last import):

```ts
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
```

and append this block at the end of the file, after the last `describe` (`"WorkflowsAdminApp role form permissions (A109, R341)"`):

```tsx
describe("WorkflowsAdminApp workflow config services (R354)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the config gateway and repository as singletons when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
        expect(container.resolve(WorkflowConfigRepository)).toBeDefined();
        expect(container.resolve(WorkflowConfigRepository)).toBe(
            container.resolve(WorkflowConfigRepository)
        );
    });

    it("registers the seven config use cases transient when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(ListStepTypesUseCase)).not.toBe(
            container.resolve(ListStepTypesUseCase)
        );
        expect(container.resolve(ListAutomationDefinitionsUseCase)).not.toBe(
            container.resolve(ListAutomationDefinitionsUseCase)
        );
        expect(container.resolve(ListNotificationTransportsUseCase)).not.toBe(
            container.resolve(ListNotificationTransportsUseCase)
        );
        expect(container.resolve(ListWorkflowTeamsUseCase)).not.toBe(
            container.resolve(ListWorkflowTeamsUseCase)
        );
        expect(container.resolve(ListWorkflowUsersUseCase)).not.toBe(
            container.resolve(ListWorkflowUsersUseCase)
        );
        expect(container.resolve(ListAiModelsUseCase)).not.toBe(
            container.resolve(ListAiModelsUseCase)
        );
        expect(container.resolve(ListAiToolsUseCase)).not.toBe(
            container.resolve(ListAiToolsUseCase)
        );
    });

    it("registers nothing of the config area when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowConfigGateway)).toThrow();
        expect(() => container.resolve(WorkflowConfigRepository)).toThrow();
        expect(() => container.resolve(ListStepTypesUseCase)).toThrow();
        expect(() => container.resolve(ListAutomationDefinitionsUseCase)).toThrow();
        expect(() => container.resolve(ListNotificationTransportsUseCase)).toThrow();
        expect(() => container.resolve(ListWorkflowTeamsUseCase)).toThrow();
        expect(() => container.resolve(ListWorkflowUsersUseCase)).toThrow();
        expect(() => container.resolve(ListAiModelsUseCase)).toThrow();
        expect(() => container.resolve(ListAiToolsUseCase)).toThrow();
    });
});
```

Modify `packages/app-workflows/src/app.cleanup.test.tsx`: `KEPT_PATHS` gains `"config"`, directly before `"editor"`:

```diff
     "settings",
+    "config",
     "editor",
     "review",
```

(Task 1 put `"gateway"` before `"settings"`, so `"settings"` and `"editor"` are still neighbours.)

- [ ] **Step 2: Run the new tests, expect failure**

One command at a time:

```bash
yarn test packages/app-workflows/src/config/gateway/WorkflowConfigGateway.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listStepTypes/ListStepTypesUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAutomationDefinitions/ListAutomationDefinitionsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listNotificationTransports/ListNotificationTransportsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listWorkflowTeams/ListWorkflowTeamsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listWorkflowUsers/ListWorkflowUsersUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAiModels/ListAiModelsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAiTools/ListAiToolsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
```

Expected:
- `WorkflowConfigGateway.test.ts`: the file loads (the moved gateway still imports `./dto.js` and `./editorFields.js`, which no longer exist next to it) and fails with `Failed to resolve import "./dto.js"` or `"./editorFields.js"`; if the resolver loads it, the success cases fail on `toEqual(envelope.data)` (the gateway returns the envelope) and every R346 case fails with "promise resolved instead of rejecting".
- The seven use-case tests, `config/feature.test.ts`: fail to load with `Failed to resolve import "./abstractions.js"` / `"~/config/repository/WorkflowConfigRepository.js"` / `"./feature.js"`.
- `editor/feature.test.ts`: fails to load (`~/config/feature.js` does not exist).
- `app.test.tsx`: fails to load (`~/config/repository/abstractions.js` and the use-case abstractions do not exist); `app.cleanup.test.tsx`: `config is kept` fails (`expected false to be true`).

- [ ] **Step 3: Implement**

**3a. The gateway contract.** Replace `packages/app-workflows/src/config/gateway/IWorkflowConfigGateway.ts` with (the parameter types stay here, R345; the methods now return DTOs):

```ts
import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

export interface ListTeamsParams {
    search: string | null;
    ids: string[] | null;
    limit: number | null;
}

export interface ListUsersParams {
    search: string | null;
    // A lookup by id ignores `search`, `limit` and `teamIds` on the server (R286).
    ids: string[] | null;
    // Only users who are in any of these teams; `null` for every user.
    teamIds: string[] | null;
    limit: number | null;
}

/*
 * The configuration lookups on the shared `workflows` root. One implementation serves every app.
 * Every method returns the envelope's data, throws a `GraphQLOperationError` for an envelope with an
 * error or without data (R346), and lets a transport failure pass as it is.
 */
export interface IWorkflowConfigGateway {
    listStepTypes(): Promise<EditorStepTypeDto[]>;
    listAutomationDefinitions(): Promise<AutomationDefinitionDto[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
    listUsers(params: ListUsersParams): Promise<WorkflowUserListDto>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiToolDto[]>;
}
```

**3b. The gateway.** Replace `packages/app-workflows/src/config/gateway/WorkflowConfigGateway.ts` with (the seven documents are copied unchanged from the moved file; only the imports, the comment and the method bodies change):

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
import type { AutomationDefinitionDto } from "~/editor/gateway/dto.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { EditorStepTypeDto } from "~/editor/gateway/dto.js";
import type { WorkflowsOperationResponse } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";
import { EDITOR_AI_MODEL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import type { ListTeamsParams } from "./IWorkflowConfigGateway.js";
import type { ListUsersParams } from "./IWorkflowConfigGateway.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./abstractions.js";

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

const LIST_USERS = /* GraphQL */ `
    query ListWorkflowUsers($search: String, $ids: [String!], $teamIds: [String!], $limit: Int) {
        workflows {
            listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit) {
                data {
                    ${EDITOR_USER_LIST_FIELDS}
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
 * The lookups on the shared `workflows` root, one implementation for every app. Each method
 * unwraps the envelope: an error or missing data becomes a `GraphQLOperationError` (R346); a
 * transport failure of the client passes as it is. `listAiModels` is a field of the AI Power-Ups
 * extension: it exists only when that extension is registered, so it is sent only when a caller
 * asks for it (R275).
 */
class WorkflowConfigGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listStepTypes(): Promise<EditorStepTypeDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listStepTypes", EditorEnvelope<EditorStepTypeDto[]>>
        >({
            query: LIST_STEP_TYPES
        });

        const envelope = response.workflows.listStepTypes;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAutomationDefinitions(): Promise<AutomationDefinitionDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listAutomationDefinitions",
                EditorEnvelope<AutomationDefinitionDto[]>
            >
        >({
            query: LIST_AUTOMATION_DEFINITIONS
        });

        const envelope = response.workflows.listAutomationDefinitions;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listNotificationTransports(): Promise<NotificationTransport[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<
                "listNotificationTransports",
                EditorEnvelope<NotificationTransport[]>
            >
        >({
            query: LIST_NOTIFICATION_TRANSPORTS
        });

        const envelope = response.workflows.listNotificationTransports;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listTeams", EditorEnvelope<WorkflowTeamList>>
        >({
            query: LIST_TEAMS,
            variables: { search: params.search, ids: params.ids, limit: params.limit }
        });

        const envelope = response.workflows.listTeams;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listUsers(params: ListUsersParams): Promise<WorkflowUserListDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listUsers", EditorEnvelope<WorkflowUserListDto>>
        >({
            query: LIST_USERS,
            variables: {
                search: params.search,
                ids: params.ids,
                teamIds: params.teamIds,
                limit: params.limit
            }
        });

        const envelope = response.workflows.listUsers;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAiModels(): Promise<AiModel[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiModels", EditorEnvelope<AiModel[]>>
        >({
            query: LIST_AI_MODELS
        });

        const envelope = response.workflows.listAiModels;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listAiTools(): Promise<AiToolDto[]> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listAiTools", EditorEnvelope<AiToolDto[]>>
        >({
            query: LIST_AI_TOOLS
        });

        const envelope = response.workflows.listAiTools;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
}

export const WorkflowConfigGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowConfigGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

**3c. The seven use-case abstractions.** Each declares its interface, its token and its namespace (R344, R360).

`packages/app-workflows/src/config/useCases/listStepTypes/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * Lists the step types the editor offers, in the server's order. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListStepTypesUseCase {
    execute(): Promise<EditorStepType[]>;
}

export const ListStepTypesUseCase = createAbstraction<IListStepTypesUseCase>(
    "Workflows/ListStepTypesUseCase"
);

export namespace ListStepTypesUseCase {
    export type Interface = IListStepTypesUseCase;
}
```

`packages/app-workflows/src/config/useCases/listAutomationDefinitions/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";

/*
 * Lists the automation definitions an automation step can run. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListAutomationDefinitionsUseCase {
    execute(): Promise<AutomationDefinition[]>;
}

export const ListAutomationDefinitionsUseCase = createAbstraction<IListAutomationDefinitionsUseCase>(
    "Workflows/ListAutomationDefinitionsUseCase"
);

export namespace ListAutomationDefinitionsUseCase {
    export type Interface = IListAutomationDefinitionsUseCase;
}
```

`packages/app-workflows/src/config/useCases/listNotificationTransports/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { NotificationTransport } from "~/editor/domain/types.js";

/*
 * Lists the notification transports a step can notify through. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListNotificationTransportsUseCase {
    execute(): Promise<NotificationTransport[]>;
}

export const ListNotificationTransportsUseCase =
    createAbstraction<IListNotificationTransportsUseCase>(
        "Workflows/ListNotificationTransportsUseCase"
    );

export namespace ListNotificationTransportsUseCase {
    export type Interface = IListNotificationTransportsUseCase;
}
```

`packages/app-workflows/src/config/useCases/listWorkflowTeams/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";

/*
 * Looks teams up by search or by ids; ids the server does not know come back in `missingIds`.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListWorkflowTeamsUseCase {
    execute(params: ListTeamsParams): Promise<WorkflowTeamList>;
}

export const ListWorkflowTeamsUseCase = createAbstraction<IListWorkflowTeamsUseCase>(
    "Workflows/ListWorkflowTeamsUseCase"
);

export namespace ListWorkflowTeamsUseCase {
    export type Interface = IListWorkflowTeamsUseCase;
    export type Params = ListTeamsParams;
}
```

`packages/app-workflows/src/config/useCases/listWorkflowUsers/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";

/*
 * Looks users up by search, by ids or by teams; ids the server does not know come back in
 * `missingIds`. Used by the editor and the settings page (R317). Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListWorkflowUsersUseCase {
    execute(params: ListUsersParams): Promise<WorkflowUserList>;
}

export const ListWorkflowUsersUseCase = createAbstraction<IListWorkflowUsersUseCase>(
    "Workflows/ListWorkflowUsersUseCase"
);

export namespace ListWorkflowUsersUseCase {
    export type Interface = IListWorkflowUsersUseCase;
    export type Params = ListUsersParams;
}
```

`packages/app-workflows/src/config/useCases/listAiModels/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";

/*
 * Lists the AI models of the AI Power-Ups extension. Call it only when the AI step type is
 * available and has a config schema: the field exists only with the extension (R275). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListAiModelsUseCase {
    execute(): Promise<AiModel[]>;
}

export const ListAiModelsUseCase = createAbstraction<IListAiModelsUseCase>(
    "Workflows/ListAiModelsUseCase"
);

export namespace ListAiModelsUseCase {
    export type Interface = IListAiModelsUseCase;
}
```

`packages/app-workflows/src/config/useCases/listAiTools/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { AiTool } from "~/editor/domain/types.js";

/*
 * Lists the tools an AI step may use. Called only with the AI editor (R275). Throws a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListAiToolsUseCase {
    execute(): Promise<AiTool[]>;
}

export const ListAiToolsUseCase = createAbstraction<IListAiToolsUseCase>(
    "Workflows/ListAiToolsUseCase"
);

export namespace ListAiToolsUseCase {
    export type Interface = IListAiToolsUseCase;
}
```

**3d. The repository.** `packages/app-workflows/src/config/repository/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";

/*
 * The configuration lookups mapped to domain types, one repository for the config area (R343),
 * shared by its seven use cases. It caches nothing and lets every error of the gateway pass as it
 * is.
 */
export interface IWorkflowConfigRepository {
    listStepTypes(): Promise<EditorStepType[]>;
    listAutomationDefinitions(): Promise<AutomationDefinition[]>;
    listNotificationTransports(): Promise<NotificationTransport[]>;
    listTeams(params: ListWorkflowTeamsUseCase.Params): Promise<WorkflowTeamList>;
    listUsers(params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList>;
    listAiModels(): Promise<AiModel[]>;
    listAiTools(): Promise<AiTool[]>;
}

export const WorkflowConfigRepository = createAbstraction<IWorkflowConfigRepository>(
    "Workflows/WorkflowConfigRepository"
);

export namespace WorkflowConfigRepository {
    export type Interface = IWorkflowConfigRepository;
}
```

`packages/app-workflows/src/config/repository/WorkflowConfigRepository.ts`:

```ts
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
import { mapWorkflowUserList } from "~/editor/gateway/mapWorkflowUserList.js";
import { WorkflowConfigRepository as RepositoryAbstraction } from "./abstractions.js";

/*
 * Maps the config gateway's DTOs to domain types. The transports, the team list and the AI models
 * have the same shape as their DTOs and pass as they are.
 */
class WorkflowConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowConfigGateway.Interface) {}

    public async listStepTypes(): Promise<EditorStepType[]> {
        const dtos = await this.gateway.listStepTypes();
        return dtos.map(mapEditorStepType);
    }

    public async listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        const dtos = await this.gateway.listAutomationDefinitions();
        return dtos.map(mapAutomationDefinition);
    }

    public listNotificationTransports(): Promise<NotificationTransport[]> {
        return this.gateway.listNotificationTransports();
    }

    public listTeams(params: ListWorkflowTeamsUseCase.Params): Promise<WorkflowTeamList> {
        return this.gateway.listTeams(params);
    }

    public async listUsers(params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList> {
        const dto = await this.gateway.listUsers(params);
        return mapWorkflowUserList(dto);
    }

    public listAiModels(): Promise<AiModel[]> {
        return this.gateway.listAiModels();
    }

    public async listAiTools(): Promise<AiTool[]> {
        const dtos = await this.gateway.listAiTools();
        return dtos.map(mapAiTool);
    }
}

export const WorkflowConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowConfigRepositoryImpl,
    dependencies: [WorkflowConfigGateway]
});
```

`packages/app-workflows/src/config/repository/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigGateway } from "~/config/gateway/WorkflowConfigGateway.js";
import { WorkflowConfigRepository } from "./WorkflowConfigRepository.js";

// The config gateway and repository, both singletons (R343, the Dashboard repository form).
export const WorkflowConfigRepositoryFeature = createFeature({
    name: "Workflows/WorkflowConfigRepository",
    register(container) {
        container.register(WorkflowConfigGateway).inSingletonScope();
        container.register(WorkflowConfigRepository).inSingletonScope();
    }
});
```

**3e. The seven use cases and their features.** Each use case is transient and calls one repository method.

`packages/app-workflows/src/config/useCases/listStepTypes/ListStepTypesUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListStepTypesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<EditorStepType[]> {
        return this.repository.listStepTypes();
    }
}

export const ListStepTypesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListStepTypesUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listStepTypes/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepTypesUseCase } from "./ListStepTypesUseCase.js";

export const ListStepTypesFeature = createFeature({
    name: "Workflows/ListStepTypes",
    register(container) {
        container.register(ListStepTypesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listAutomationDefinitions/ListAutomationDefinitionsUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAutomationDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AutomationDefinition[]> {
        return this.repository.listAutomationDefinitions();
    }
}

export const ListAutomationDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAutomationDefinitionsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listAutomationDefinitions/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

export const ListAutomationDefinitionsFeature = createFeature({
    name: "Workflows/ListAutomationDefinitions",
    register(container) {
        container.register(ListAutomationDefinitionsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listNotificationTransports/ListNotificationTransportsUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListNotificationTransportsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<NotificationTransport[]> {
        return this.repository.listNotificationTransports();
    }
}

export const ListNotificationTransportsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListNotificationTransportsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listNotificationTransports/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListNotificationTransportsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";

export const ListNotificationTransportsFeature = createFeature({
    name: "Workflows/ListNotificationTransports",
    register(container) {
        container.register(ListNotificationTransportsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listWorkflowTeams/ListWorkflowTeamsUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowTeamsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(params: UseCaseAbstraction.Params): Promise<WorkflowTeamList> {
        return this.repository.listTeams(params);
    }
}

export const ListWorkflowTeamsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowTeamsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listWorkflowTeams/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

export const ListWorkflowTeamsFeature = createFeature({
    name: "Workflows/ListWorkflowTeams",
    register(container) {
        container.register(ListWorkflowTeamsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listWorkflowUsers/ListWorkflowUsersUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowUsersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(params: UseCaseAbstraction.Params): Promise<WorkflowUserList> {
        return this.repository.listUsers(params);
    }
}

export const ListWorkflowUsersUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listWorkflowUsers/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

export const ListWorkflowUsersFeature = createFeature({
    name: "Workflows/ListWorkflowUsers",
    register(container) {
        container.register(ListWorkflowUsersUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listAiModels/ListAiModelsUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAiModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AiModel[]> {
        return this.repository.listAiModels();
    }
}

export const ListAiModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAiModelsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listAiModels/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiModelsUseCase } from "./ListAiModelsUseCase.js";

export const ListAiModelsFeature = createFeature({
    name: "Workflows/ListAiModels",
    register(container) {
        container.register(ListAiModelsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

`packages/app-workflows/src/config/useCases/listAiTools/ListAiToolsUseCase.ts`:

```ts
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { AiTool } from "~/editor/domain/types.js";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListAiToolsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(): Promise<AiTool[]> {
        return this.repository.listAiTools();
    }
}

export const ListAiToolsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAiToolsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
```

`packages/app-workflows/src/config/useCases/listAiTools/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiToolsUseCase } from "./ListAiToolsUseCase.js";

export const ListAiToolsFeature = createFeature({
    name: "Workflows/ListAiTools",
    register(container) {
        container.register(ListAiToolsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

**3f. The area composite.** `packages/app-workflows/src/config/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigRepositoryFeature } from "./repository/feature.js";
import { ListAiModelsFeature } from "./useCases/listAiModels/feature.js";
import { ListAiToolsFeature } from "./useCases/listAiTools/feature.js";
import { ListAutomationDefinitionsFeature } from "./useCases/listAutomationDefinitions/feature.js";
import { ListNotificationTransportsFeature } from "./useCases/listNotificationTransports/feature.js";
import { ListStepTypesFeature } from "./useCases/listStepTypes/feature.js";
import { ListWorkflowTeamsFeature } from "./useCases/listWorkflowTeams/feature.js";
import { ListWorkflowUsersFeature } from "./useCases/listWorkflowUsers/feature.js";

/*
 * The configuration area, registered once by `WorkflowsAdminApp` inside the feature flag gate
 * (R211, R354): the config gateway and repository (singletons) and the seven lookup use cases
 * (transient), used by the workflow editor and the settings page.
 */
export const WorkflowConfigServicesFeature = createFeature({
    name: "Workflows/WorkflowConfigServices",
    register(container) {
        WorkflowConfigRepositoryFeature.register(container);
        ListStepTypesFeature.register(container);
        ListAutomationDefinitionsFeature.register(container);
        ListNotificationTransportsFeature.register(container);
        ListWorkflowTeamsFeature.register(container);
        ListWorkflowUsersFeature.register(container);
        ListAiModelsFeature.register(container);
        ListAiToolsFeature.register(container);
    }
});
```

**3g. The bridge (R356).** Replace `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts` with:

```ts
import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * A temporary bridge (R356): the old config bundle delegates every method to its config use case,
 * so a consumer that still injects the bundle keeps working while the consumers move (Task 4).
 * Task 14 deletes it with its interface, token and fake.
 */
class WorkflowConfigUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(
        private listStepTypesUseCase: ListStepTypesUseCase.Interface,
        private listAutomationDefinitionsUseCase: ListAutomationDefinitionsUseCase.Interface,
        private listNotificationTransportsUseCase: ListNotificationTransportsUseCase.Interface,
        private listWorkflowTeamsUseCase: ListWorkflowTeamsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface,
        private listAiModelsUseCase: ListAiModelsUseCase.Interface,
        private listAiToolsUseCase: ListAiToolsUseCase.Interface
    ) {}

    public listStepTypes(): Promise<EditorStepType[]> {
        return this.listStepTypesUseCase.execute();
    }

    public listAutomationDefinitions(): Promise<AutomationDefinition[]> {
        return this.listAutomationDefinitionsUseCase.execute();
    }

    public listNotificationTransports(): Promise<NotificationTransport[]> {
        return this.listNotificationTransportsUseCase.execute();
    }

    public listTeams(params: ListTeamsParams): Promise<WorkflowTeamList> {
        return this.listWorkflowTeamsUseCase.execute(params);
    }

    public listUsers(params: ListUsersParams): Promise<WorkflowUserList> {
        return this.listWorkflowUsersUseCase.execute(params);
    }

    public listAiModels(): Promise<AiModel[]> {
        return this.listAiModelsUseCase.execute();
    }

    public listAiTools(): Promise<AiTool[]> {
        return this.listAiToolsUseCase.execute();
    }
}

export const WorkflowConfigUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowConfigUseCasesImpl,
    dependencies: [
        ListStepTypesUseCase,
        ListAutomationDefinitionsUseCase,
        ListNotificationTransportsUseCase,
        ListWorkflowTeamsUseCase,
        ListWorkflowUsersUseCase,
        ListAiModelsUseCase,
        ListAiToolsUseCase
    ]
});
```

Modify `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts` (the parameter types moved with the gateway contract):

```diff
-import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
-import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
+import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";
+import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";
 import type { AiModel } from "~/editor/domain/types.js";
```

Delete the old bundle test (its mapping cases now live in the seven use-case tests, its error-mapping cases in the gateway test):

```bash
git rm packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.test.ts
```

**3h. The editor services.** Replace `packages/app-workflows/src/editor/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowConfigUseCases as ConfigUseCasesAbstraction } from "./useCases/abstractions.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor toasts and, until Task 14, the config bridge (R356, R364), which runs on
 * the use cases of `WorkflowConfigServicesFeature`. Both are singletons. The config gateway is
 * registered by the config area. The per-app editor use cases are registered by each app package.
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        container.register(WorkflowConfigUseCases).inSingletonScope();
        container.register(WorkflowEditorToasts).inSingletonScope();
    },
    resolve(container) {
        return {
            configUseCases: container.resolve(ConfigUseCasesAbstraction),
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
```

**3i. The composition root.** Modify `packages/app-workflows/src/app.tsx`:

```diff
 import { ReviewServicesFeature } from "~/review/feature.js";
+import { WorkflowConfigServicesFeature } from "~/config/feature.js";
 import { WorkflowEditorServicesFeature } from "~/editor/feature.js";
```

```diff
             <RegisterFeature feature={ReviewServicesFeature} />
+            <RegisterFeature feature={WorkflowConfigServicesFeature} />
             <RegisterFeature feature={WorkflowEditorServicesFeature} />
             <RegisterFeature feature={WorkflowSettingsServicesFeature} />
```

**3j. The settings test that typed a lookup.** Modify `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts` (its old import path no longer exists; R345: a consumer reaches the parameter type as the use case's `Params`):

```diff
-import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
+import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

```diff
-const answerLookup = async (params: ListUsersParams): Promise<WorkflowUserList> => {
+const answerLookup = async (
+    params: ListWorkflowUsersUseCase.Params
+): Promise<WorkflowUserList> => {
```

Then confirm nothing imports the old paths:

```bash
grep -rnE "editor/gateway/(IWorkflowConfigGateway|WorkflowConfigGateway|abstractions)\.js" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
grep -rnE "\./gateway/(IWorkflowConfigGateway|WorkflowConfigGateway|abstractions)\.js" packages/app-workflows/src/editor
```

Expected: no output from either command.

- [ ] **Step 4: Run the new tests, expect pass**

One command at a time:

```bash
yarn test packages/app-workflows/src/config/gateway/WorkflowConfigGateway.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listStepTypes/ListStepTypesUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAutomationDefinitions/ListAutomationDefinitionsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listNotificationTransports/ListNotificationTransportsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listWorkflowTeams/ListWorkflowTeamsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listWorkflowUsers/ListWorkflowUsersUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAiModels/ListAiModelsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/useCases/listAiTools/ListAiToolsUseCase.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/config/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
```

Expected: every file passes (the gateway test: 14 single cases plus 3 × 7 `it.each` cases).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

The consumers of the bridge and of the moved types, and the mapper tests the repository relies on, one command at a time:

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/gateway/mapEditorStepType.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/gateway/mapAutomationDefinition.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/gateway/mapWorkflowUserList.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/gateway/mapAiTool.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the presenter tests still run over `createFakeConfigUseCases` registered under the bridge token, which Task 4 replaces); the build prints no TypeScript error.

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
git commit -m "refactor(app-workflows): give the config lookups their own area with a repository and seven use cases" -m "The config gateway moves from editor/ to config/ and unwraps the envelope itself: an error or missing data becomes a GraphQLOperationError through the shared helper, a transport failure passes. WorkflowConfigRepository maps the DTOs; ListStepTypes, ListAutomationDefinitions, ListNotificationTransports, ListWorkflowTeams, ListWorkflowUsers, ListAiModels and ListAiTools are one use case each, registered by WorkflowConfigServicesFeature in WorkflowsAdminApp. The old WorkflowConfigUseCases bundle delegates to them until its last consumer moves. No document, variable or value changes." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`WorkflowEditorServicesFeature` keeps `register` for the bridge only.** The contract says Task 3 stops registering the config gateway there; the bridge's registration and `resolve` (`configUseCases`, R364) stay, and `[AWE]/feature.test.ts` gains a case proving the gateway is no longer registered by it.
- **Repository method names** are the gateway's (`listTeams`, `listUsers`), not the use-case names (`listWorkflowTeams`, `listWorkflowUsers`): the contract fixes only "the seven methods"; the repository mirrors the gateway as the review and editor repositories mirror theirs.
- **Fake gateway home:** `createFakeConfigGateway` lives in the new `[AWC]/testing/` (R243: area test support beside the area, vitest fakes in their own file). It is a fake of the gateway layer for use-case tests (R355), not an aggregate use-case fake.
- **`ExclusionsPagePresenter.names.test.ts`** is not in the contract's Task 3 file list, but it imports `ListUsersParams` from the moved `[AWE]/gateway/IWorkflowConfigGateway.ts`, so it must change in this task to keep compiling. Task 2 does not touch this file (its settings-fake renames cover only the `load` and `dialogs` page tests); Task 4's rename script edits its `config.listUsers` accesses afterwards. The two hunks here touch only its import and `answerLookup` signature.
- **`app.test.tsx` and `app.cleanup.test.tsx` anchors:** Task 1 edits both files first (its settings imports after line 27, extra cases inside the settings `describe`, `"gateway"` before `"settings"` in `KEPT_PATHS`). The config imports go after the file's last import, the new `describe` at the end of the file, and `"config"` between `"settings"` and `"editor"`, none of which Task 1 touches.
- Size: large (a moved and rewritten gateway with its test, 33 new files of which 8 are tests, the bridge rewrite, five small modifications).

## Review fixes (sub-phase review)

- Contract note on `ExclusionsPagePresenter.names.test.ts` corrected: Task 2 does not edit that file (its renames cover only the `load` and `dialogs` tests); Task 4's script edits its `config.listUsers` accesses later.
- Consistency ruling: the bridge already uses the suffixed field names (`listStepTypesUseCase` and so on); nothing to change.
- Checked against HEAD, no other change: the seven GraphQL documents are identical character for character to the current `editor/gateway/WorkflowConfigGateway.ts`; the moved `abstractions.ts` content; every importer of the moved files (`editor/feature.test.ts`, `IWorkflowConfigUseCases.ts`, the bridge, `ExclusionsPagePresenter.names.test.ts` line 9 and 31); `editor/feature.ts` and `app.tsx` hunks; the fixtures the use-case tests import; the anchors in `app.test.tsx` (last import line 40, last `describe` "role form permissions") and `KEPT_PATHS` after Task 1.
