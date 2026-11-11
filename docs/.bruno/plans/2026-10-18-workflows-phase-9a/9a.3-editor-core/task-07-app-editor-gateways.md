### Task 7: CMS and WB editor gateways

R202, R204, R237, R238, R243, R280; D116, D136; Review Focus 1, 10. Each app owns its GraphQL documents and the gateway that runs them, binds the one shared `WorkflowEditorUseCases` (Task 5) through a one-line subclass under its own token, and registers both from its package root behind the feature flag. `app-workflows` knows no app; the apps know no editor logic.

Behaviour:

- **CMS** (`packages/app-headless-cms-workflows/src/features/editorGateway`): `CmsWorkflowEditorGateway` (token `Cms/Workflows/WorkflowEditorGateway`) over `MainGraphQLClient` on the `cms` root. `listModels` runs `listCmsEntryWorkflowModels(search, limit, after)` (paged, server search, R280) and folds the server's `data` and `meta` into the shared `WorkflowModelPageDto { rows, meta }`: an `error` becomes `{ data: null, error }`, no `data` becomes `{ data: null, error: null }`, an absent `meta` becomes `{ cursor: null, hasMoreItems: false }`. An empty `search` is sent as `null`. `getWorkflow(id)`, `storeWorkflow({ data, savedOn })` and `deleteWorkflow(id)` run `getCmsEntryWorkflow`, `storeCmsEntryWorkflow(data, savedOn)` and `deleteCmsEntryWorkflow(id)`; they return the server's envelope as it is. The store call sends `savedOn` exactly as given (a string or `null`, Review Focus 1). Every document selects `EDITOR_WORKFLOW_FIELDS` and `ERROR_FIELDS`. The gateway never throws for an envelope error (R204); a transport failure rejects as it is.
- **WB** (`packages/app-website-builder-workflows/src/features/editorGateway`): the mirror on the `websiteBuilder` root, with the page operations `getWebsiteBuilderPageWorkflow`, `storeWebsiteBuilderPageWorkflow`, `deleteWebsiteBuilderPageWorkflow`. `listModels` has no server list: it answers one row `{ model: "wb.page", modelId: "page", name: "Pages", workflow }` where `workflow` is `{ id, name }` of the page workflow that binds `wb.page` (from `listWebsiteBuilderPageWorkflows`, a light document selecting `id name models`) or `null`; the page is always the last (`cursor: null`, `hasMoreItems: false`) and `search`, `limit` and `after` are ignored (R280: WB has one row and no search). An error envelope becomes `{ data: null, error }`.
- **Use cases:** `CmsWorkflowEditorUseCases` and `WbWorkflowEditorUseCases` are tokens over `IWorkflowEditorUseCases`; the implementations are `class CmsWorkflowEditorUseCasesImpl extends WorkflowEditorUseCases implements UseCasesAbstraction.Interface {}` and the WB twin, each created with its own gateway as the dependency, registered as singletons (R237).
- **Features:** `CmsWorkflowEditorFeature` (name `CmsWorkflows/WorkflowEditor`) and `WbWorkflowEditorFeature` (name `WebsiteBuilderWorkflows/WorkflowEditor`) register the gateway and the use cases as singletons and resolve `{ useCases }`. `CmsWorkflows` and `WebsiteBuilderWorkflows` register them next to `CmsReviewFeature` and `WbReviewFeature`, inside the flag gate.

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway.ts` (token)
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCases.ts` (token)
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCasesImpl.ts` (subclass)
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/listCmsEntryWorkflowModels.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/getCmsEntryWorkflow.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/storeCmsEntryWorkflow.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/deleteCmsEntryWorkflow.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway.ts` (token)
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCases.ts` (token)
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCasesImpl.ts` (subclass)
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/feature.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/listWebsiteBuilderPageWorkflowNames.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/getWebsiteBuilderPageWorkflow.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/storeWebsiteBuilderPageWorkflow.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/deleteWebsiteBuilderPageWorkflow.ts`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`

**Interfaces:**
- Consumes (Task 5, by deep path): `IWorkflowEditorGateway`, `ListWorkflowModelsParams`, `StoreWorkflowParams` (`@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js`); `EditorEnvelope`, `EditorErrorDto`, `EditorListMetaDto`, `EditorWorkflowDto`, `WorkflowModelPageDto`, `WorkflowModelRowDto` (`@webiny/app-workflows/editor/gateway/dto.js`); `EDITOR_WORKFLOW_FIELDS` (`.../editor/gateway/editorFields.js`); `IWorkflowEditorUseCases` (`.../editor/useCases/IWorkflowEditorUseCases.js`); the plain `WorkflowEditorUseCases` (`.../editor/useCases/WorkflowEditorUseCases.js`); `WorkflowErrorCode` (`.../editor/domain/WorkflowErrorCode.js`); the pure fixtures `createEditorWorkflowDto`, `createWorkflowModelRowDto`, `EDITOR_SAVED_ON` (`.../editor/testing/editorFixtures.js`, R243); `ERROR_FIELDS` (`@webiny/app-workflows/review/gateway/reviewFields.js`); `GraphQLOperationError` (`@webiny/app/errors/index.js`); `MainGraphQLClient`; `CmsOperationResponse` (`~/features/gateway/graphql/CmsOperationResponse.js`), `WbOperationResponse` (`~/features/gateway/graphql/WbOperationResponse.js`); `WB_PAGE_APP` (`~/constants.js` of the WB package, `"wb.page"`).
- Produces: `CmsWorkflowEditorUseCases` and `WbWorkflowEditorUseCases` (tokens, `IWorkflowEditorUseCases`), `CmsWorkflowEditorFeature` and `WbWorkflowEditorFeature` (resolve `{ useCases }`); the use cases are what Tasks 20 and 21 hand to the shared editor view with `useFeature`.

**Test runner note:** admin packages, `yarn test <path>` only; `.tsx` tests import `React`. If a run reports `Failed to resolve import "@webiny/app-workflows/editor/..."`, build the dependency first with `yarn build -p @webiny/app-workflows` (Tasks 5, 5b, 5c and 6 already built it in their commit chains; rebuild if `dist` is stale). A deep import of a sibling app package (the WB `feature.test.ts` imports the CMS `editorGateway` files) resolves through that package's `dist`, so build `@webiny/app-headless-cms-workflows` after Step 3 and before the WB runs of Step 4.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGatewayImpl.js";

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

describe("CmsWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(CmsWorkflowEditorGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    describe("listModels", () => {
        it("sends search, limit and after and folds data and meta into one page", async () => {
            const rows = [createWorkflowModelRowDto()];
            client.execute.mockResolvedValue({
                cms: {
                    listCmsEntryWorkflowModels: {
                        data: rows,
                        meta: { cursor: "cursor-2", hasMoreItems: true },
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "art", limit: 20, after: "cursor-1" });

            expect(result).toEqual({
                data: { rows, meta: { cursor: "cursor-2", hasMoreItems: true } },
                error: null
            });
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ search: "art", limit: 20, after: "cursor-1" });
            expect(request.query).toContain("cms");
            expect(request.query).toContain(
                "listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after)"
            );
            expect(request.query).toContain("meta");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("selects the model, its name and the bound workflow's id and name", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            await gateway.listModels({ search: "", limit: 20, after: null });

            const query: string = client.execute.mock.calls[0][0].query;
            expect(query).toMatch(/model\s+modelId\s+name\s+workflow\s*\{\s*id\s+name\s*\}/);
        });

        it("sends an empty search as null", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            await gateway.listModels({ search: "", limit: 20, after: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ search: null, limit: 20, after: null });
        });

        it("answers the default meta when the server sends none", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({
                data: { rows: [], meta: { cursor: null, hasMoreItems: false } },
                error: null
            });
        });

        it("answers an error envelope without data and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: null, meta: null, error } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error });
        });

        it("answers neither data nor error when the server sends neither", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: null, meta: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error: null });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.listModels({ search: "", limit: 20, after: null })).rejects.toBe(
                failure
            );
        });
    });

    describe("getWorkflow", () => {
        it("reads the workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { getCmsEntryWorkflow: envelope } });

            const result = await gateway.getWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("getCmsEntryWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns an error envelope as it is", async () => {
            const envelope = {
                data: null,
                error: { code: "Workflows/Workflow/NotFound", message: "Gone.", data: { id: "x" } }
            };
            client.execute.mockResolvedValue({ cms: { getCmsEntryWorkflow: envelope } });

            expect(await gateway.getWorkflow("x")).toEqual(envelope);
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { storeCmsEntryWorkflow: envelope } });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: "2026-10-18T09:15:30.123Z" });
            expect(request.variables.data).toBe(input);
            expect(request.query).toContain("mutation");
            expect(request.query).toContain("storeCmsEntryWorkflow(data: $data, savedOn: $savedOn)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null savedOn for a new workflow", async () => {
            client.execute.mockResolvedValue({
                cms: { storeCmsEntryWorkflow: { data: createEditorWorkflowDto(), error: null } }
            });

            await gateway.storeWorkflow({ data: input, savedOn: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: null });
        });

        it("returns a conflict envelope as it is and does not throw (R204)", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/Conflict",
                    message: "The workflow was changed.",
                    data: { savedOn: "2026-10-18T10:00:00.000Z" }
                }
            };
            client.execute.mockResolvedValue({ cms: { storeCmsEntryWorkflow: envelope } });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(
                gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON })
            ).rejects.toBe(failure);
        });
    });

    describe("deleteWorkflow", () => {
        it("deletes the workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { deleteCmsEntryWorkflow: envelope } });

            const result = await gateway.deleteWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("mutation");
            expect(request.query).toContain("deleteCmsEntryWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
        });

        it("returns a blocked delete envelope as it is", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/HasActiveReviews",
                    message: "In use.",
                    data: { count: 2, reviews: [] }
                }
            };
            client.execute.mockResolvedValue({ cms: { deleteCmsEntryWorkflow: envelope } });

            expect(await gateway.deleteWorkflow("workflow-1")).toEqual(envelope);
        });
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorUseCases } from "./CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorFeature } from "./feature.js";

describe("CmsWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        CmsWorkflowEditorFeature.register(container);
    });

    it("registers the gateway and the use cases under the CMS tokens", () => {
        const { useCases } = CmsWorkflowEditorFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(container.resolve(CmsWorkflowEditorGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(CmsWorkflowEditorGateway)).toBe(
            container.resolve(CmsWorkflowEditorGateway)
        );
        expect(container.resolve(CmsWorkflowEditorUseCases)).toBe(
            container.resolve(CmsWorkflowEditorUseCases)
        );
    });

    it("runs the shared use cases over the CMS gateway: the model list", async () => {
        client.execute.mockResolvedValue({
            cms: {
                listCmsEntryWorkflowModels: {
                    data: [createWorkflowModelRowDto()],
                    meta: { cursor: "cursor-2", hasMoreItems: true },
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const page = await useCases.listModels({ search: "", limit: 20, after: null });

        expect(page.cursor).toBe("cursor-2");
        expect(page.hasMoreItems).toBe(true);
        expect(page.rows[0].model).toBe("cms.article");
    });

    it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
        client.execute.mockResolvedValueOnce({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30.123Z" }),
                    error: null
                }
            }
        });
        client.execute.mockResolvedValueOnce({
            cms: {
                storeCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:20:00.000Z" }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const loaded = await useCases.getWorkflow("workflow-1");
        const stored = await useCases.storeWorkflow({
            data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
            savedOn: loaded.savedOn
        });

        expect(loaded.savedOn).toBe(EDITOR_SAVED_ON);
        expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
        expect(stored.savedOn).toBe("2026-10-18T09:20:00.000Z");
    });

    it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
        const data = { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { displayName: "Grace" } };
        client.execute.mockResolvedValue({
            cms: {
                storeCmsEntryWorkflow: {
                    data: null,
                    error: {
                        code: WorkflowErrorCode.Conflict,
                        message: "The workflow was changed.",
                        data
                    }
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const promise = useCases.storeWorkflow({
            data: { id: "workflow-1", name: "A", models: ["cms.article"], steps: [] },
            savedOn: EDITOR_SAVED_ON
        });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Conflict, data });
    });

    it("lets a transport failure pass through the use cases as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        await expect(useCases.deleteWorkflow("workflow-1")).rejects.toBe(failure);
    });
});
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx`. Add the import after the `CmsReviewUseCases` import line:

```ts
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
```

Add two tests inside `describe("CmsWorkflows composition")`, directly after the test `registers nothing with the flag off` (after its closing `});`):

```tsx

    it("registers the CMS workflow editor use cases with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers no workflow editor use cases with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorUseCases)).toThrow(
            "No registration found"
        );
    });
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./WbWorkflowEditorGateway.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGatewayImpl.js";

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Page review",
    models: ["wb.page"],
    steps: [
        {
            id: "step-1",
            title: "Legal",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

describe("WbWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WbWorkflowEditorGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    describe("listModels", () => {
        it("answers the single Pages row with the workflow that binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [
                            { id: "workflow-other", name: "Other", models: ["cms.article"] },
                            { id: "workflow-1", name: "Page review", models: ["wb.page"] }
                        ],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({
                data: {
                    rows: [
                        {
                            model: "wb.page",
                            modelId: "page",
                            name: "Pages",
                            workflow: { id: "workflow-1", name: "Page review" }
                        }
                    ],
                    meta: { cursor: null, hasMoreItems: false }
                },
                error: null
            });
        });

        it("answers the row without a workflow when no workflow binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [{ id: "workflow-other", name: "Other", models: ["cms.article"] }],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows).toEqual([
                { model: "wb.page", modelId: "page", name: "Pages", workflow: null }
            ]);
        });

        it("answers the row without a workflow for an empty list", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows[0].workflow).toBeNull();
            expect(result.error).toBeNull();
        });

        it("takes the first workflow that binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [
                            { id: "workflow-1", name: "First", models: ["wb.page"] },
                            { id: "workflow-2", name: "Second", models: ["wb.page"] }
                        ],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows[0].workflow).toEqual({ id: "workflow-1", name: "First" });
        });

        it("ignores search, limit and after: one request, no variables, one last page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            });

            const result = await gateway.listModels({ search: "zzz", limit: 5, after: "cursor-9" });

            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toBeUndefined();
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain("listWebsiteBuilderPageWorkflows");
            expect(request.query).toMatch(/id\s+name\s+models/);
            expect(request.query).toContain(ERROR_FIELDS);
            expect(result.data?.rows).toHaveLength(1);
            expect(result.data?.meta).toEqual({ cursor: null, hasMoreItems: false });
        });

        it("answers an error envelope without data and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: null, error } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error });
        });

        it("answers neither data nor error when the server sends neither", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error: null });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.listModels({ search: "", limit: 20, after: null })).rejects.toBe(
                failure
            );
        });
    });

    describe("getWorkflow", () => {
        it("reads the page workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto({ models: ["wb.page"] }), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { getWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.getWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain("getWebsiteBuilderPageWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: "2026-10-18T09:15:30.123Z" });
            expect(request.variables.data).toBe(input);
            expect(request.query).toContain("mutation");
            expect(request.query).toContain(
                "storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn)"
            );
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null savedOn for a new workflow", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    storeWebsiteBuilderPageWorkflow: { data: createEditorWorkflowDto(), error: null }
                }
            });

            await gateway.storeWorkflow({ data: input, savedOn: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: null });
        });

        it("returns a conflict envelope as it is and does not throw (R204)", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/Conflict",
                    message: "The workflow was changed.",
                    data: { savedOn: "2026-10-18T10:00:00.000Z" }
                }
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(
                gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON })
            ).rejects.toBe(failure);
        });
    });

    describe("deleteWorkflow", () => {
        it("deletes the page workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { deleteWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.deleteWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("mutation");
            expect(request.query).toContain("deleteWebsiteBuilderPageWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
        });
    });
});
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorFeature } from "@webiny/app-headless-cms-workflows/features/editorGateway/feature.js";
import { CmsWorkflowEditorUseCases } from "@webiny/app-headless-cms-workflows/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";
import { WbWorkflowEditorUseCases } from "./WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorFeature } from "./feature.js";

interface RecordedRequest {
    query: string;
}

describe("WbWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbWorkflowEditorFeature.register(container);
    });

    it("registers the gateway and the use cases under the WB tokens", () => {
        const { useCases } = WbWorkflowEditorFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(container.resolve(WbWorkflowEditorGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(WbWorkflowEditorGateway)).toBe(
            container.resolve(WbWorkflowEditorGateway)
        );
        expect(container.resolve(WbWorkflowEditorUseCases)).toBe(
            container.resolve(WbWorkflowEditorUseCases)
        );
    });

    it("runs the shared use cases over the WB gateway: the single Pages row", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: {
                listWebsiteBuilderPageWorkflows: {
                    data: [{ id: "workflow-1", name: "Page review", models: ["wb.page"] }],
                    error: null
                }
            }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const page = await useCases.listModels({ search: "", limit: 20, after: null });

        expect(page.rows).toEqual([
            {
                model: "wb.page",
                modelId: "page",
                name: "Pages",
                workflow: { id: "workflow-1", name: "Page review" }
            }
        ]);
        expect(page.cursor).toBeNull();
        expect(page.hasMoreItems).toBe(false);
    });

    it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
        client.execute.mockResolvedValueOnce({
            websiteBuilder: {
                getWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ models: ["wb.page"] }),
                    error: null
                }
            }
        });
        client.execute.mockResolvedValueOnce({
            websiteBuilder: {
                storeWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ models: ["wb.page"] }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const loaded = await useCases.getWorkflow("workflow-1");
        await useCases.storeWorkflow({
            data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
            savedOn: loaded.savedOn
        });

        expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
    });

    it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
        const data = { count: 1, reviews: [{ reviewId: "review-1" }] };
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deleteWebsiteBuilderPageWorkflow: {
                    data: null,
                    error: {
                        code: WorkflowErrorCode.HasActiveReviews,
                        message: "In use.",
                        data
                    }
                }
            }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const promise = useCases.deleteWorkflow("workflow-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: WorkflowErrorCode.HasActiveReviews,
            data
        });
    });

    it("lets a transport failure pass through the use cases as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        await expect(useCases.getWorkflow("workflow-1")).rejects.toBe(failure);
    });

    it("lets the CMS and WB editor features coexist in one container, each with its own gateway (R237)", async () => {
        CmsWorkflowEditorFeature.register(container);
        client.execute.mockImplementation(async (request: RecordedRequest) => {
            if (request.query.includes("getCmsEntryWorkflow")) {
                return {
                    cms: {
                        getCmsEntryWorkflow: {
                            data: createEditorWorkflowDto({ id: "workflow-cms" }),
                            error: null
                        }
                    }
                };
            }
            return {
                websiteBuilder: {
                    getWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                        error: null
                    }
                }
            };
        });
        const cmsUseCases = container.resolve(CmsWorkflowEditorUseCases);
        const wbUseCases = container.resolve(WbWorkflowEditorUseCases);

        const cms = await cmsUseCases.getWorkflow("workflow-cms");
        const wb = await wbUseCases.getWorkflow("workflow-wb");

        expect(wbUseCases).not.toBe(cmsUseCases);
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        const queries = client.execute.mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryWorkflow"))).toHaveLength(1);
        expect(
            queries.filter(query => query.includes("getWebsiteBuilderPageWorkflow"))
        ).toHaveLength(1);
    });
});
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx`. Add the import after the `WbReviewUseCases` import line:

```ts
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
```

Add two tests inside `describe("WebsiteBuilderWorkflows composition")`, directly after the test `registers nothing with the flag off` (after its closing `});`):

```tsx

    it("registers the WB workflow editor use cases with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers no workflow editor use cases with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: the four new test files fail with `Failed to resolve import` for `CmsWorkflowEditorGateway.js`, `CmsWorkflowEditorUseCases.js`, `feature.js`, `WbWorkflowEditorGateway.js` and `WbWorkflowEditorUseCases.js`; the two `index.test.tsx` files fail to resolve the use-case token module (the whole file, so their existing cases fail too until Step 3). Record the RED output.

- [ ] **Step 3: Implement**

CMS documents. Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/listCmsEntryWorkflowModels.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_WORKFLOW_MODELS = /* GraphQL */ `
    query ListCmsEntryWorkflowModels($search: String, $limit: Int, $after: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after) {
                data {
                    model
                    modelId
                    name
                    workflow {
                        id
                        name
                    }
                }
                meta {
                    cursor
                    hasMoreItems
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/getCmsEntryWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_WORKFLOW = /* GraphQL */ `
    query GetCmsEntryWorkflow($id: ID!) {
        cms {
            getCmsEntryWorkflow(id: $id) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/storeCmsEntryWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const STORE_CMS_ENTRY_WORKFLOW = /* GraphQL */ `
    mutation StoreCmsEntryWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/deleteCmsEntryWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const DELETE_CMS_ENTRY_WORKFLOW = /* GraphQL */ `
    mutation DeleteCmsEntryWorkflow($id: ID!) {
        cms {
            deleteCmsEntryWorkflow(id: $id) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";

export const CmsWorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "Cms/Workflows/WorkflowEditorGateway"
);

export namespace CmsWorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { EditorEnvelope } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorErrorDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorListMetaDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { CmsOperationResponse } from "~/features/gateway/graphql/CmsOperationResponse.js";
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { DELETE_CMS_ENTRY_WORKFLOW } from "./graphql/deleteCmsEntryWorkflow.js";
import { GET_CMS_ENTRY_WORKFLOW } from "./graphql/getCmsEntryWorkflow.js";
import { LIST_CMS_ENTRY_WORKFLOW_MODELS } from "./graphql/listCmsEntryWorkflowModels.js";
import { STORE_CMS_ENTRY_WORKFLOW } from "./graphql/storeCmsEntryWorkflow.js";

// A list answer of the server: the rows and the page meta next to the error.
interface CmsWorkflowModelListEnvelope {
    data: WorkflowModelRowDto[] | null;
    meta: EditorListMetaDto | null;
    error: EditorErrorDto | null;
}

class CmsWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listModels(
        params: ListWorkflowModelsParams
    ): Promise<EditorEnvelope<WorkflowModelPageDto>> {
        const search = params.search.length > 0 ? params.search : null;

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryWorkflowModels", CmsWorkflowModelListEnvelope>
        >({
            query: LIST_CMS_ENTRY_WORKFLOW_MODELS,
            variables: { search, limit: params.limit, after: params.after }
        });

        const envelope = response.cms.listCmsEntryWorkflowModels;
        if (envelope.error) {
            return { data: null, error: envelope.error };
        }
        if (!envelope.data) {
            return { data: null, error: null };
        }
        const meta: EditorListMetaDto = envelope.meta ?? { cursor: null, hasMoreItems: false };
        return { data: { rows: envelope.data, meta }, error: null };
    }

    async getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"getCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: GET_CMS_ENTRY_WORKFLOW,
            variables: { id }
        });

        return response.cms.getCmsEntryWorkflow;
    }

    async storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"storeCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: STORE_CMS_ENTRY_WORKFLOW,
            variables: { data: params.data, savedOn: params.savedOn }
        });

        return response.cms.storeCmsEntryWorkflow;
    }

    async deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"deleteCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: DELETE_CMS_ENTRY_WORKFLOW,
            variables: { id }
        });

        return response.cms.deleteCmsEntryWorkflow;
    }
}

export const CmsWorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: CmsWorkflowEditorGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/IWorkflowEditorUseCases.js";

export const CmsWorkflowEditorUseCases = createAbstraction<IWorkflowEditorUseCases>(
    "Cms/Workflows/WorkflowEditorUseCases"
);

export namespace CmsWorkflowEditorUseCases {
    export type Interface = IWorkflowEditorUseCases;
}
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCasesImpl.ts`:

```ts
import { WorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/WorkflowEditorUseCases.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorUseCases as UseCasesAbstraction } from "./CmsWorkflowEditorUseCases.js";

/*
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `WorkflowEditorUseCases`, so each app binds its own
 * subclass; binding the shared class twice would let the second call overwrite the first.
 */
class CmsWorkflowEditorUseCasesImpl
    extends WorkflowEditorUseCases
    implements UseCasesAbstraction.Interface {}

export const CmsWorkflowEditorUseCases = UseCasesAbstraction.createImplementation({
    implementation: CmsWorkflowEditorUseCasesImpl,
    dependencies: [CmsWorkflowEditorGateway]
});
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowEditorUseCases as UseCasesAbstraction } from "./CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGatewayImpl.js";
import { CmsWorkflowEditorUseCases } from "./CmsWorkflowEditorUseCasesImpl.js";

export const CmsWorkflowEditorFeature = createFeature({
    name: "CmsWorkflows/WorkflowEditor",
    register(container) {
        container.register(CmsWorkflowEditorGateway).inSingletonScope();
        container.register(CmsWorkflowEditorUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction)
        };
    }
});
```

Modify `packages/app-headless-cms-workflows/src/index.tsx`. Add the import after the `CmsReviewFeature` import:

```ts
import { CmsWorkflowEditorFeature } from "~/features/editorGateway/feature.js";
```

and register the feature after `<RegisterFeature feature={CmsReviewFeature} />`:

```tsx
            <RegisterFeature feature={CmsReviewFeature} />
            <RegisterFeature feature={CmsWorkflowEditorFeature} />
            <RegisterFeature feature={CmsContentReviewsPresenterFeature} />
```

WB documents. Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/listWebsiteBuilderPageWorkflowNames.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

/*
 * The page workflows with only what the model row needs: the id, the name and the bound
 * namespaces. The editor loads the whole workflow later with `getWebsiteBuilderPageWorkflow`.
 */
export const LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES = /* GraphQL */ `
    query ListWebsiteBuilderPageWorkflowNames {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
                data {
                    id
                    name
                    models
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/getWebsiteBuilderPageWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_WORKFLOW = /* GraphQL */ `
    query GetWebsiteBuilderPageWorkflow($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageWorkflow(id: $id) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/storeWebsiteBuilderPageWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const STORE_WEBSITE_BUILDER_PAGE_WORKFLOW = /* GraphQL */ `
    mutation StoreWebsiteBuilderPageWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        websiteBuilder {
            storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/deleteWebsiteBuilderPageWorkflow.ts`:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const DELETE_WEBSITE_BUILDER_PAGE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWebsiteBuilderPageWorkflow($id: ID!) {
        websiteBuilder {
            deleteWebsiteBuilderPageWorkflow(id: $id) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";

export const WbWorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "WebsiteBuilder/Workflows/WorkflowEditorGateway"
);

export namespace WbWorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { EditorEnvelope } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorErrorDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import { WB_PAGE_APP } from "~/constants.js";
import type { WbOperationResponse } from "~/features/gateway/graphql/WbOperationResponse.js";
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./WbWorkflowEditorGateway.js";
import { DELETE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/deleteWebsiteBuilderPageWorkflow.js";
import { GET_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/getWebsiteBuilderPageWorkflow.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES } from "./graphql/listWebsiteBuilderPageWorkflowNames.js";
import { STORE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/storeWebsiteBuilderPageWorkflow.js";

// The one row of the WB list: Pages (R280).
const WB_PAGES_MODEL_ID = "page";
const WB_PAGES_MODEL_NAME = "Pages";

interface WbPageWorkflowNameDto {
    id: string;
    name: string;
    models: string[];
}

interface WbPageWorkflowNameListEnvelope {
    data: WbPageWorkflowNameDto[] | null;
    error: EditorErrorDto | null;
}

class WbWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    /*
     * Website Builder has one model, `wb.page`, so there is nothing to search or page: the
     * parameters are ignored and the answer is the single last page with the row Pages and the
     * page workflow that binds it.
     */
    async listModels(): Promise<EditorEnvelope<WorkflowModelPageDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"listWebsiteBuilderPageWorkflows", WbPageWorkflowNameListEnvelope>
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES
        });

        const envelope = response.websiteBuilder.listWebsiteBuilderPageWorkflows;
        if (envelope.error) {
            return { data: null, error: envelope.error };
        }
        if (!envelope.data) {
            return { data: null, error: null };
        }
        const bound = envelope.data.find(workflow => workflow.models.includes(WB_PAGE_APP));
        const row: WorkflowModelRowDto = {
            model: WB_PAGE_APP,
            modelId: WB_PAGES_MODEL_ID,
            name: WB_PAGES_MODEL_NAME,
            workflow: null
        };
        if (bound) {
            row.workflow = { id: bound.id, name: bound.name };
        }
        return {
            data: { rows: [row], meta: { cursor: null, hasMoreItems: false } },
            error: null
        };
    }

    async getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageWorkflow",
                EditorEnvelope<EditorWorkflowDto>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { id }
        });

        return response.websiteBuilder.getWebsiteBuilderPageWorkflow;
    }

    async storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "storeWebsiteBuilderPageWorkflow",
                EditorEnvelope<EditorWorkflowDto>
            >
        >({
            query: STORE_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { data: params.data, savedOn: params.savedOn }
        });

        return response.websiteBuilder.storeWebsiteBuilderPageWorkflow;
    }

    async deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "deleteWebsiteBuilderPageWorkflow",
                EditorEnvelope<EditorWorkflowDto>
            >
        >({
            query: DELETE_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { id }
        });

        return response.websiteBuilder.deleteWebsiteBuilderPageWorkflow;
    }
}

export const WbWorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: WbWorkflowEditorGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/IWorkflowEditorUseCases.js";

export const WbWorkflowEditorUseCases = createAbstraction<IWorkflowEditorUseCases>(
    "WebsiteBuilder/Workflows/WorkflowEditorUseCases"
);

export namespace WbWorkflowEditorUseCases {
    export type Interface = IWorkflowEditorUseCases;
}
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCasesImpl.ts`:

```ts
import { WorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/WorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";
import { WbWorkflowEditorUseCases as UseCasesAbstraction } from "./WbWorkflowEditorUseCases.js";

/*
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `WorkflowEditorUseCases`, so each app binds its own
 * subclass; binding the shared class twice would let the second call overwrite the first.
 */
class WbWorkflowEditorUseCasesImpl
    extends WorkflowEditorUseCases
    implements UseCasesAbstraction.Interface {}

export const WbWorkflowEditorUseCases = UseCasesAbstraction.createImplementation({
    implementation: WbWorkflowEditorUseCasesImpl,
    dependencies: [WbWorkflowEditorGateway]
});
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbWorkflowEditorUseCases as UseCasesAbstraction } from "./WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGatewayImpl.js";
import { WbWorkflowEditorUseCases } from "./WbWorkflowEditorUseCasesImpl.js";

export const WbWorkflowEditorFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WorkflowEditor",
    register(container) {
        container.register(WbWorkflowEditorGateway).inSingletonScope();
        container.register(WbWorkflowEditorUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction)
        };
    }
});
```

Modify `packages/app-website-builder-workflows/src/index.tsx`. Add the import after the `WbReviewFeature` import:

```ts
import { WbWorkflowEditorFeature } from "~/features/editorGateway/feature.js";
```

and register the feature after `<RegisterFeature feature={WbReviewFeature} />`:

```tsx
            <RegisterFeature feature={WbReviewFeature} />
            <RegisterFeature feature={WbWorkflowEditorFeature} />
            <WbContentReviews />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes to check on the first run: (1) the `WbWorkflowEditorGatewayImpl.listModels()` declares no parameters although the interface takes `params`; TypeScript allows an implementation with fewer parameters, and the gateway test calls it with arguments through the interface type. (2) The two-app test in the WB `feature.test.ts` imports the CMS package by deep path, as the existing WB `feature.test.ts` already does for `CmsReviewUseCases`; if the CMS package is not resolvable there, replace that single test with a copy that registers two local subclasses (the pattern of `WorkflowEditorUseCases.test.ts`).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages. The cleanup tests only assert that listed feature names are present and old paths are gone, so the new registrations do not change them.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(workflows): add the CMS and Website Builder workflow editor gateways" -m "Each app gets its editor gateway over its own documents (the CMS model list with server search and paging, the single Pages row for the Website Builder), its one-line subclass of the shared WorkflowEditorUseCases under its own token, and a feature registered from its package root behind the feature flag. The store call sends the loaded savedOn string unchanged." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **WB model row:** the contract says `listModels` returns "the single `wb.page` row (`Pages`; its bound workflow from `listWebsiteBuilderPageWorkflows`)". `WorkflowModelRow` has `modelId` for the CMS model id; the WB row uses `modelId: "page"` (the WB page model has no id of its own; nothing reads it for WB). `model` is `"wb.page"` (`WB_PAGE_APP`), the namespace a workflow binds.
- **WB list document:** the contract does not list a WB documents file for the list; this task adds `listWebsiteBuilderPageWorkflowNames.ts` (the light `id name models` selection) rather than reusing the review gateway's `LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS`, which selects every step and config of every workflow the model row does not need.
- **CMS document names:** the four CMS documents are `listCmsEntryWorkflowModels`, `getCmsEntryWorkflow`, `storeCmsEntryWorkflow` and `deleteCmsEntryWorkflow`, as the contract names them; the WB mirror is `getWebsiteBuilderPageWorkflow`, `storeWebsiteBuilderPageWorkflow`, `deleteWebsiteBuilderPageWorkflow` plus the list document above (`CmsWorkflowsSchemaFactory.ts:154-203` and `WebsiteBuilderWorkflowsSchemaFactory.ts:125-170` define the root fields and their arguments).
- **Server-side empty search:** `listCmsEntryWorkflowModels(search: String)` receives `null` for an empty search; verified: `ListCmsEntryWorkflowModelsUseCase.ts:76` reads `(input.search ?? "").trim().toLowerCase()`, so `null` and an empty string both mean no filter.
- **Two-app coexistence test** (WB `feature.test.ts`) mirrors the existing cross-package precedent of that file; the same-class two-subclass proof (R237) lives in `app-workflows` (`WorkflowEditorUseCases.test.ts`, Task 5).
- **Tasks 20 and 21** resolve the use cases with `useFeature(CmsWorkflowEditorFeature)` and `useFeature(WbWorkflowEditorFeature)` (`.useCases`) and pass them to the shared view as the `useCases` prop; the review use cases come from `CmsReviewFeature` and `WbReviewFeature` (already registered).
