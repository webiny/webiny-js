### Task 8: `ListWorkflowAiToolsUseCase` and `WorkflowsQuery.listAiTools`

Spec 9.3, 11; D55, D132, D133 point 2; R87, R138 (mirror), R167, R176; Review Focus 2. The shared operation the workflow editor uses to offer the tools an author can allowlist on an AI step. It mirrors `ListAutomationDefinitionsUseCase` (phase 5 Task 3) line by line, over the Task 7 registry:

- `ListWorkflowAiToolsUseCase.execute(): Promise<Result<WorkflowAiToolInfo[], UseCaseError>>`, `UseCaseError = WorkflowsNotAuthenticatedError | WorkflowsNotAuthorizedError | WorkflowPersistenceError`. Order of checks: the viewer actor (`CurrentReviewViewer.getActor()`, an anonymous identity fails with `WorkflowsNotAuthenticatedError`), then `WorkflowsPermissions.canEdit()`: `workflows.editor` only (a full-access set passes, a user with only `reassign` is refused with `WorkflowsNotAuthorizedError({ action: "list AI tools" })`, message `You are not allowed to list AI tools.`). D132: the permission check lives in this shared configuration use case because the GraphQL resolver calls only shared configuration use cases.
- A throwing permission read, a throwing `WorkflowAiToolRegistryService.list()` and a throwing tool getter while building a row each become a `WorkflowPersistenceError` carrying the original error (R87, R138 mirror); nothing rejects.
- Rows are `{ name, title, description }`, exactly these three keys (no input schema: the editor needs only what to show, the model-facing schema is the runner's concern), sorted by `title` (`localeCompare`), ties by `name`. Every registered tool is listed, the built-ins included once Task 10 registers them; a tool name is not filtered by anything here (the editor lists what a step may allowlist, R167); a tool with an invalid name was already dropped and logged by the registry (Task 7), so it is absent from the list and the use case neither fails nor logs.
- GraphQL (`graphql/WorkflowsSchemaFactory.ts`, R176): `type WorkflowsAiTool { name: String!, title: String!, description: String! }`, `type WorkflowsAiToolListResponse { data: [WorkflowsAiTool!], error: WorkflowsError }` like `WorkflowsStepTypeListResponse`, and `listAiTools: WorkflowsAiToolListResponse!` on `WorkflowsQuery` (after `listAutomationDefinitions`, before `listUsers`). The resolver calls only `ListWorkflowAiToolsUseCase` and wraps its Result in `Response` or `ErrorResponse`. `listAiModels` (R176) is added by `ai-powerups` (Task 16), not here.
- Registered in `WorkflowsFeature` (`ListWorkflowAiToolsFeature`).

**Files:**
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowAiTools/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowAiTools/ListWorkflowAiToolsUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowAiTools/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowAiTools/index.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (one added assertion; no existing expectation changes)

**Interfaces:**
- Consumes:
  - Task 7: `WorkflowAiToolRegistryService` (`~/features/aiTools/WorkflowAiToolRegistryService/index.js`, `list(): WorkflowAiTool.Interface[]`), `WorkflowAiTool` (`~/features/aiTools/WorkflowAiTool/index.js`), test helpers `registerTestAiTool(container, overrides?)`, `TEST_AI_TOOL_NAME` (`~tests/__helpers/TestWorkflowAiTool.js`).
  - Existing: `CurrentReviewViewer` (`~/features/identity/CurrentReviewViewer/index.js`, `getActor()`), `WorkflowsPermissions` (`~/features/permissions/WorkflowsPermissions/index.js`, `canEdit()`), `WorkflowsNotAuthenticatedError`, `WorkflowsNotAuthorizedError` (`~/domain/permissions/errors.js`), `WorkflowPersistenceError` (`~/domain/workflow/errors.js`), `ErrorResponse`, `Response` (`@webiny/api-graphql`).
  - Test helpers (reused, never redefined): `createContextHandler` (`~tests/__helpers/handler.js`), `expectOk` (`~tests/__helpers/fixtures.js`); in `workflowsSchema.test.ts` the file's own `createApi`, `EDITOR`, `REASSIGNER`, `ERROR_FIELDS`, `memberNames`, `GraphQLBody`, `WorkflowsRoot`, `ErrorRow`.
- Produces (matches the contract):
  - `WorkflowAiToolInfo { name: string; title: string; description: string }` (`~/domain/config/types.js`).
  - `ListWorkflowAiToolsUseCase` (`~/features/config/ListWorkflowAiTools/index.js`), namespace types `Interface`, `Error`, `Return`: `execute(): Promise<Result<WorkflowAiToolInfo[], UseCaseError>>`. Consumed by the GraphQL resolver and by the admin phases.
  - GraphQL `WorkflowsQuery.listAiTools: WorkflowsAiToolListResponse!` (R176).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    registerTestAiTool,
    TEST_AI_TOOL_NAME,
    testAiToolInputSchema
} from "~tests/__helpers/TestWorkflowAiTool.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createListContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listAiTools: context.container.resolve(ListWorkflowAiToolsUseCase)
    };
};

describe("ListWorkflowAiToolsUseCase (R167, R176)", () => {
    it("lists nothing when no tool is registered", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        expect(expectOk(await listAiTools.execute())).toEqual([]);
    });

    it("lists name, title and description only, with no schema", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTestAiTool(container, {
                    title: "Test tool",
                    description: "A tool for tests."
                });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows).toEqual([
            { name: TEST_AI_TOOL_NAME, title: "Test tool", description: "A tool for tests." }
        ]);
        expect(Object.keys(rows[0])).toEqual(["name", "title", "description"]);
    });

    it("sorts the rows by title, then by name", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                registerTestAiTool(container, { name: "zulu", title: "Zulu" });
                registerTestAiTool(container, { name: "alphaTwo", title: "Alpha" });
                registerTestAiTool(container, { name: "mike", title: "Mike" });
                registerTestAiTool(container, { name: "alphaOne", title: "Alpha" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows.map(row => row.name)).toEqual(["alphaOne", "alphaTwo", "mike", "zulu"]);
    });

    it("lists a replaced tool once, with the last registration's texts (A61)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                registerTestAiTool(container, { title: "Original" });
                registerTestAiTool(container, { title: "Replacement" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Replacement");
    });

    it("skips a tool with an invalid name without an error (R167, R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: "my-tool", title: "Bad" });
                registerTestAiTool(container, { title: "Good" });
            }
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows.map(row => row.name)).toEqual([TEST_AI_TOOL_NAME]);
    });

    it("allows a full-access permission set", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows.*" }]
        });

        expect((await listAiTools.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.message).toBe("You are not allowed to list AI tools.");
        expect(result.error.data).toEqual({ action: "list AI tools" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listAiTools } = await createListContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listAiTools.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
    });

    it("returns the workflow persistence error when the tool list throws (R87)", async () => {
        const { listAiTools } = await createListContext({
            setup: (container: Container) => {
                container.registerInstance(WorkflowAiToolRegistryService, {
                    get: () => null,
                    list: () => {
                        throw new Error("The tool list is down.");
                    }
                });
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("The tool list is down.");
    });

    it("returns the workflow persistence error when a tool getter throws (R87)", async () => {
        class BrokenTool implements WorkflowAiTool.Interface {
            public readonly name = "brokenTool";
            public readonly description = "Broken.";
            public readonly inputSchema = testAiToolInputSchema;

            public get title(): string {
                throw new Error("The title is down.");
            }

            public async execute(): Promise<WorkflowAiTool.Result> {
                return { ok: true };
            }
        }
        const { listAiTools } = await createListContext({
            setup: container => {
                container.registerInstance(WorkflowAiTool, new BrokenTool());
            }
        });

        const result = await listAiTools.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("The title is down.");
    });
});
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`. Add the import next to the `registerTestAutomation` import:

```ts
import { registerTestAiTool, TEST_AI_TOOL_NAME } from "~tests/__helpers/TestWorkflowAiTool.js";
```

Add the query constant after `LIST_AUTOMATION_DEFINITIONS`:

```ts
const LIST_AI_TOOLS = /* GraphQL */ `
    query ListAiTools {
        workflows {
            listAiTools {
                data {
                    name
                    title
                    description
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

Add the result interfaces after `ListAutomationDefinitionsResult`:

```ts
interface AiToolRow {
    name: string;
    title: string;
    description: string;
}

interface AiToolsEnvelope {
    data: AiToolRow[] | null;
    error: ErrorRow | null;
}

interface ListAiToolsResult {
    listAiTools: AiToolsEnvelope;
}
```

In the object `createApi` returns, add after `listAutomationDefinitions`:

```ts
        listAiTools: createQuery<GraphQLBody<WorkflowsRoot<ListAiToolsResult>>>(LIST_AI_TOOLS),
```

Add these three tests directly after the test "refuses the automation definitions to a user without editor":

```ts
    it("lists the AI tools by title, with no schema (R167, R176)", async () => {
        const api = await createApi({
            permissions: EDITOR,
            setup: container => {
                registerTestAiTool(container, { name: "zuluTool", title: "Zulu" });
                registerTestAiTool(container, {
                    title: "Alpha",
                    description: "A tool for tests."
                });
            }
        });

        const [response] = await api.listAiTools();

        expect(response.data.workflows.listAiTools).toEqual({
            data: [
                { name: TEST_AI_TOOL_NAME, title: "Alpha", description: "A tool for tests." },
                { name: "zuluTool", title: "Zulu", description: "A tool for tests." }
            ],
            error: null
        });
    });

    it("lists no AI tools when none is registered", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listAiTools();

        expect(response.data.workflows.listAiTools).toEqual({ data: [], error: null });
    });

    it("refuses the AI tools to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listAiTools();

        expect(response.data.workflows.listAiTools).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list AI tools.",
                data: { action: "list AI tools" }
            }
        });
    });
```

In the test "exposes the shared types the app schemas reuse (R100)" replace the `WorkflowsQuery` expectation and add the two new types after the `WorkflowsAutomationDefinitionListResponse` expectation:

```ts
        expect(memberNames(types, "WorkflowsQuery")).toEqual([
            "getSettings",
            "listStepTypes",
            "listAutomationDefinitions",
            "listAiTools",
            "listUsers"
        ]);
```

```ts
        expect(memberNames(types, "WorkflowsAiTool")).toEqual(["name", "title", "description"]);
        expect(memberNames(types, "WorkflowsAiToolListResponse")).toEqual(["data", "error"]);
```

(This changes one existing expectation, the `WorkflowsQuery` field list, because the schema gains a field: an intended addition, not a regression. Other tasks of this phase add their own fields to other types in the same test.)

Modify `packages/api-workflows/__tests__/registration.test.ts`. Add the import next to the `ListAutomationDefinitionsUseCase` import:

```ts
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";
```

and add directly after `expect(container.resolveAll(ListAutomationDefinitionsUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(ListWorkflowAiToolsUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `~/features/config/ListWorkflowAiTools/index.js` cannot be resolved; the GraphQL tests fail with `Cannot query field "listAiTools" on type "WorkflowsQuery"`, and the introspection expectation lacks `listAiTools`.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The row type, the use case, the schema and the resolver**

In `packages/api-workflows/src/domain/config/types.ts` add after `AutomationDefinitionInfo`:

```ts
/**
 * An AI tool a workflow author can allowlist on an AI step (R167): a row of `listAiTools`. No
 * input schema: the editor shows what a tool is, the runner builds what the model sees.
 */
export interface WorkflowAiToolInfo {
    name: string;
    title: string;
    description: string;
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowAiTools/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowAiToolsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowAiToolsUseCaseErrors[keyof IListWorkflowAiToolsUseCaseErrors];

export interface IListWorkflowAiToolsUseCase {
    execute(): Promise<Result<WorkflowAiToolInfo[], UseCaseError>>;
}

/**
 * The AI tools a workflow author can allowlist on an AI step (spec 9.3, R167): needs
 * `workflows.editor`. Sorted by title. The shared `listAiTools` GraphQL operation calls this.
 */
export const ListWorkflowAiToolsUseCase = createAbstraction<IListWorkflowAiToolsUseCase>(
    "ListWorkflowAiToolsUseCase"
);

export namespace ListWorkflowAiToolsUseCase {
    export type Interface = IListWorkflowAiToolsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowAiToolInfo[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowAiTools/ListWorkflowAiToolsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowAiToolsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowAiToolsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private tools: WorkflowAiToolRegistryService.Interface
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
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list AI tools" }));
        }

        let rows: WorkflowAiToolInfo[];
        try {
            rows = this.tools.list().map(tool => {
                return { name: tool.name, title: tool.title, description: tool.description };
            });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        rows.sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));
        return Result.ok(rows);
    }
}

export const ListWorkflowAiToolsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowAiToolsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WorkflowAiToolRegistryService]
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowAiTools/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowAiToolsUseCase } from "./ListWorkflowAiToolsUseCase.js";

export const ListWorkflowAiToolsFeature = createFeature({
    name: "Workflows/ListWorkflowAiTools",
    register(container) {
        container.register(ListWorkflowAiToolsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowAiTools/index.ts`:

```ts
export { ListWorkflowAiToolsUseCase } from "./abstractions.js";
export type { WorkflowAiToolInfo } from "~/domain/config/types.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add the import next to the `ListAutomationDefinitionsFeature` import:

```ts
import { ListWorkflowAiToolsFeature } from "~/features/config/ListWorkflowAiTools/feature.js";
```

and register it directly after `ListAutomationDefinitionsFeature.register(container);`:

```ts
        ListAutomationDefinitionsFeature.register(container);
        ListWorkflowAiToolsFeature.register(container);
```

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` add the import next to the `ListAutomationDefinitionsUseCase` import:

```ts
import { ListWorkflowAiToolsUseCase } from "~/features/config/ListWorkflowAiTools/index.js";
```

In the schema string add the two types after `WorkflowsAutomationDefinitionListResponse`:

```graphql
    type WorkflowsAiTool {
        "The name a step stores in its tool allowlist."
        name: String!
        title: String!
        "What the tool does; the model reads the same text."
        description: String!
    }

    type WorkflowsAiToolListResponse {
        data: [WorkflowsAiTool!]
        error: WorkflowsError
    }
```

and the field in `WorkflowsQuery`, between `listAutomationDefinitions` and `listUsers`:

```graphql
        listAutomationDefinitions: WorkflowsAutomationDefinitionListResponse!
        listAiTools: WorkflowsAiToolListResponse!
```

Add the resolver directly after the `WorkflowsQuery.listAutomationDefinitions` resolver:

```ts
        builder.addResolver({
            path: "WorkflowsQuery.listAiTools",
            dependencies: [ListWorkflowAiToolsUseCase],
            resolver: (listAiTools: ListWorkflowAiToolsUseCase.Interface) => {
                return async () => {
                    const result = await listAiTools.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 5: Run the existing tests covering the changed code**

`WorkflowsSchemaFactory` and `WorkflowsFeature` changed; the sibling configuration operations and Task 7's tests share the files and the registry:

Run: `yarn test packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts packages/api-workflows/__tests__/config/WorkflowSettingsForEditor.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts packages/api-workflows/__tests__/config/WorkflowSettingsForEditor.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the listAiTools operation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
