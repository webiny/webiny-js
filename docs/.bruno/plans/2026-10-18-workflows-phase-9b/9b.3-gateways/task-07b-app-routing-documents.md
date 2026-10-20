### Task 7b: CMS and WB `inspectRouting` and `folderExists` documents

R289, R291, R292, R300 (`modelId` and `folderId` in the request), D133, D172, D173; Q54, Q55; Review Focus 6, 7, 10 (`00-shared.md`). The phase 9a Global Constraints and Rulings R202-R284 apply unchanged (read: the envelope contract R204, the registration rule with root tests flag on and off, one public function per file, one named import per line, no inline object types, no nested call arguments, comments end with a period, targeted tests, the pre-commit chain, the editor-only gate).

Both apps already expose the server operations (Phase 3 and 4, extended by Task 4): `cms { inspectCmsEntryRouting(stepConfig: JSON!, modelId: ID!, requesterId: ID!, folderId: ID) cmsEntryFolderExists(id: ID!, type: String!) }` and `websiteBuilder { inspectWebsiteBuilderPageRouting(stepConfig: JSON!, requesterId: ID!, folderId: ID) websiteBuilderPageFolderExists(id: ID!) }`; the folder-exists answer is a `WorkflowsBooleanResponse { data: Boolean error }`. This task adds the two documents and the two gateway methods of each app, behind the per-app gateway interface Task 7 extended. No new token and no new registration: the existing `CmsWorkflowEditorGateway` / `WbWorkflowEditorGateway` implementation classes gain the methods, and the shared plain use-case class of Task 7 (bound once per app by the existing subclass) already calls them.

- **CMS documents** (`[CMSW]/features/editorGateway/graphql/inspectCmsEntryRouting.ts`, `cmsEntryFolderExists.ts`): `INSPECT_CMS_ENTRY_ROUTING` is a query with `$stepConfig: JSON!`, `$modelId: ID!`, `$requesterId: ID!`, `$folderId: ID` selecting `data { ${EDITOR_ROUTING_INSPECTION_FIELDS} } error { ${ERROR_FIELDS} }` (the shared fragment of Task 7, so every R289 field is selected and nothing is duplicated across the apps). `CMS_ENTRY_FOLDER_EXISTS` is a query with `$id: ID!`, `$type: String!` selecting `data` (a scalar) and `error { ${ERROR_FIELDS} }`.
- **CMS gateway** (`CmsWorkflowEditorGatewayImpl`): `inspectRouting(params)` sends `{ stepConfig, modelId, requesterId, folderId }` exactly as given (the bare `modelId`, `null` folder is the root) and returns `response.cms.inspectCmsEntryRouting`; `folderExists(params)` sends `{ id, type }` and returns `response.cms.cmsEntryFolderExists`. Envelopes are returned as they are, also for a server error (R204); a transport failure rejects.
- **WB documents** (`[WBW]/features/editorGateway/graphql/inspectWebsiteBuilderPageRouting.ts`, `websiteBuilderPageFolderExists.ts`): the same, under the `websiteBuilder` root, with no `$modelId` and no `$type` (the WB schema has neither; its folder type is always `wb:page`, R291).
- **WB gateway** (`WbWorkflowEditorGatewayImpl`): `inspectRouting(params)` sends `{ stepConfig, requesterId, folderId }` and ignores `params.modelId`; `folderExists(params)` sends `{ id }` and ignores `params.type`. The WB root is `websiteBuilder` (`WbOperationResponse`), not `wb`.
- **Not changed:** `feature.ts` of both gateway folders, the use-case subclasses, the abstraction tokens, `editorMounting/feature.ts`. The existing `feature.test.ts` assertions (registrations, singletons) stay as they are; this task adds tests that run the new use-case methods through each feature's container and through each package's gated root.

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/inspectCmsEntryRouting.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/cmsEntryFolderExists.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/inspectWebsiteBuilderPageRouting.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorGateway/graphql/websiteBuilderPageFolderExists.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`

**Interfaces:**
- Consumes (verified with codegraph and the source): `IWorkflowEditorGateway`, `InspectRoutingParams`, `FolderExistsParams` (`@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js`, Task 7), `EditorEnvelope`, `RoutingInspectionDto` (`@webiny/app-workflows/editor/gateway/dto.js`, Task 7), `EDITOR_ROUTING_INSPECTION_FIELDS` (`@webiny/app-workflows/editor/gateway/editorFields.js`, Task 7), `ERROR_FIELDS` (`@webiny/app-workflows/review/gateway/reviewFields.js`), `CmsOperationResponse` (`~/features/gateway/graphql/CmsOperationResponse.js`), `WbOperationResponse` (`~/features/gateway/graphql/WbOperationResponse.js`), `createRoutingInspectionDto` (`@webiny/app-workflows/editor/testing/editorFixtures.js`, Task 7), the existing gateway test and `feature.test.ts` setups, `CmsWorkflowEditorUseCases` and `WbWorkflowEditorUseCases` tokens. Server side: the operations above, with the R289 SDL (Task 4).
- Produces (matches the contract): `CmsWorkflowEditorGateway` and `WbWorkflowEditorGateway` with `inspectRouting` and `folderExists`, the four GraphQL documents `INSPECT_CMS_ENTRY_ROUTING`, `CMS_ENTRY_FOLDER_EXISTS`, `INSPECT_WEBSITE_BUILDER_PAGE_ROUTING`, `WEBSITE_BUILDER_PAGE_FOLDER_EXISTS`. These are the per-app gateway methods behind Task 7's use cases; Task 14b's presenter calls them through `IWorkflowEditorUseCases`.

**Test runner note:** admin packages, `yarn test <path>` only. Type check of the co-located tests is `yarn build -p <package> --no-cache` (R243).

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`.

Before:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
```

After:

```ts
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
```

Before:

```ts
describe("CmsWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
```

After:

```ts
const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: {
            strategy: "roundRobin",
            allowManualPick: false,
            rules: [{ id: "rule-1", conditions: {}, target: { type: "team", id: "team-1" } }]
        }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "cms:article" };

describe("CmsWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
```

Before:

```ts
    describe("deleteWorkflow", () => {
```

After:

```ts
    describe("inspectRouting", () => {
        it("sends the step config, the bare model id, the requester and the folder as variables", async () => {
            const envelope = { data: createRoutingInspectionDto(), error: null };
            client.execute.mockResolvedValue({ cms: { inspectCmsEntryRouting: envelope } });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual(envelope);
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({
                stepConfig: inspectParams.stepConfig,
                modelId: "article",
                requesterId: "user-1",
                folderId: "folder-1"
            });
            expect(request.query).toContain("query InspectCmsEntryRouting");
            expect(request.query).toContain("cms");
            expect(request.query).toContain(
                "inspectCmsEntryRouting(stepConfig: $stepConfig, modelId: $modelId, requesterId: $requesterId, folderId: $folderId)"
            );
            expect(request.query).toContain("$stepConfig: JSON!");
            expect(request.query).toContain("$modelId: ID!");
            expect(request.query).toContain("$requesterId: ID!");
            expect(request.query).toContain("$folderId: ID");
            expect(request.query).toContain(EDITOR_ROUTING_INSPECTION_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null folder as the root", async () => {
            client.execute.mockResolvedValue({
                cms: { inspectCmsEntryRouting: { data: createRoutingInspectionDto(), error: null } }
            });

            await gateway.inspectRouting({ ...inspectParams, folderId: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables.folderId).toBeNull();
        });

        it("selects every field of the extended inspection (R289)", async () => {
            client.execute.mockResolvedValue({
                cms: { inspectCmsEntryRouting: { data: createRoutingInspectionDto(), error: null } }
            });

            await gateway.inspectRouting(inspectParams);

            const query: string = client.execute.mock.calls[0][0].query;
            expect(query).toMatch(/narrowedTeamId\s+candidateIds\s+candidateCount/);
            expect(query).toMatch(/trace\s*\{\s*ruleId\s+outcome\s+reason\s+failedConditions\s*\}/);
            expect(query).toMatch(/skipped\s*\{\s*userId\s+displayName\s+reason\s*\}/);
        });

        it("returns a validation error of a rule as an envelope and does not throw (R204)", async () => {
            const error = {
                code: "Workflows/Workflow/Validation",
                message: "The target user is not a member of the step's teams.",
                data: {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    ruleId: "rule-1",
                    workflowId: null
                }
            };
            client.execute.mockResolvedValue({
                cms: { inspectCmsEntryRouting: { data: null, error } }
            });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.inspectRouting(inspectParams)).rejects.toBe(failure);
        });
    });

    describe("folderExists", () => {
        it("sends the folder id and the folder type as variables", async () => {
            const envelope = { data: true, error: null };
            client.execute.mockResolvedValue({ cms: { cmsEntryFolderExists: envelope } });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "folder-1", type: "cms:article" });
            expect(request.query).toContain("query CmsEntryFolderExists");
            expect(request.query).toContain("cmsEntryFolderExists(id: $id, type: $type)");
            expect(request.query).toContain("$id: ID!");
            expect(request.query).toContain("$type: String!");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns false as an answer, not an error", async () => {
            const envelope = { data: false, error: null };
            client.execute.mockResolvedValue({ cms: { cmsEntryFolderExists: envelope } });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: false, error: null });
        });

        it("returns a server error as an envelope and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                cms: { cmsEntryFolderExists: { data: null, error } }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.folderExists(folderParams)).rejects.toBe(failure);
        });
    });

    describe("deleteWorkflow", () => {
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`.

Before:

```ts
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
```

After:

```ts
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
```

Before:

```ts
    it("runs the shared use cases over the CMS gateway: the model list", async () => {
```

After:

```ts
    it("runs the shared use cases over the CMS gateway: the routing inspection", async () => {
        client.execute.mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: createRoutingInspectionDto({
                        ruleId: "rule-2",
                        narrowedTeamId: "team-2",
                        candidateIds: ["user-3"],
                        candidateCount: 4
                    }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        expect(inspection.ruleId).toBe("rule-2");
        expect(inspection.narrowedTeamId).toBe("team-2");
        expect(inspection.candidateIds).toEqual(["user-3"]);
        expect(inspection.candidateCount).toBe(4);
        expect(client.execute.mock.calls[0][0].variables.modelId).toBe("article");
        expect(client.execute.mock.calls[0][0].variables.folderId).toBeNull();
    });

    it("runs the shared use cases over the CMS gateway: a deleted folder is false, not an error", async () => {
        client.execute.mockResolvedValue({
            cms: { cmsEntryFolderExists: { data: false, error: null } }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const exists = await useCases.folderExists({ id: "folder-1", type: "cms:article" });

        expect(exists).toBe(false);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            id: "folder-1",
            type: "cms:article"
        });
    });

    it("turns a rule validation error of the inspector into a GraphQLOperationError that keeps the rule id", async () => {
        const data = {
            stepId: "step-1",
            field: "config.assignment.rules.target",
            ruleId: "rule-1",
            workflowId: null
        };
        client.execute.mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: null,
                    error: {
                        code: WorkflowErrorCode.Validation,
                        message: "The target team is not one of the step's reviewing teams.",
                        data
                    }
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const promise = useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Validation, data });
    });

    it("runs the shared use cases over the CMS gateway: the model list", async () => {
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (the gated root: the new operation is reachable with the flag on, nothing else is registered with it off, which the existing flag-off cases already prove).

Before:

```ts
    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
```

After:

```ts
    it("sends the routing inspection of the editor through the CMS gateway with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCases = container.resolve(CmsWorkflowEditorUseCases);
        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(inspection.owner).toBeNull();
        expect(lastRequest.query).toContain("inspectCmsEntryRouting");
    });

    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`.

Before:

```ts
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
```

After:

```ts
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
```

Before:

```ts
describe("WbWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
```

After:

```ts
const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: {
            strategy: "leastLoaded",
            allowManualPick: false,
            rules: [{ id: "rule-1", conditions: {}, target: { type: "team", id: "team-1" } }]
        }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "page"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "wb:page" };

describe("WbWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
```

Before:

```ts
    describe("deleteWorkflow", () => {
```

After:

```ts
    describe("inspectRouting", () => {
        it("sends the step config, the requester and the folder and ignores the model id", async () => {
            const envelope = { data: createRoutingInspectionDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { inspectWebsiteBuilderPageRouting: envelope }
            });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual(envelope);
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: "folder-1"
            });
            expect(request.query).toContain("query InspectWebsiteBuilderPageRouting");
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain(
                "inspectWebsiteBuilderPageRouting(stepConfig: $stepConfig, requesterId: $requesterId, folderId: $folderId)"
            );
            expect(request.query).toContain("$stepConfig: JSON!");
            expect(request.query).toContain("$requesterId: ID!");
            expect(request.query).toContain("$folderId: ID");
            expect(request.query).not.toContain("modelId");
            expect(request.query).toContain(EDITOR_ROUTING_INSPECTION_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null folder as the root", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
                        data: createRoutingInspectionDto(),
                        error: null
                    }
                }
            });

            await gateway.inspectRouting({ ...inspectParams, folderId: null, modelId: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables.folderId).toBeNull();
            expect(request.variables).not.toHaveProperty("modelId");
        });

        it("selects every field of the extended inspection (R289)", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
                        data: createRoutingInspectionDto(),
                        error: null
                    }
                }
            });

            await gateway.inspectRouting(inspectParams);

            const query: string = client.execute.mock.calls[0][0].query;
            expect(query).toMatch(/narrowedTeamId\s+candidateIds\s+candidateCount/);
            expect(query).toMatch(/trace\s*\{\s*ruleId\s+outcome\s+reason\s+failedConditions\s*\}/);
            expect(query).toMatch(/skipped\s*\{\s*userId\s+displayName\s+reason\s*\}/);
        });

        it("returns a validation error of a rule as an envelope and does not throw (R204)", async () => {
            const error = {
                code: "Workflows/Workflow/Validation",
                message: "The target user is not a member of the step's teams.",
                data: {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    ruleId: "rule-1",
                    workflowId: null
                }
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { inspectWebsiteBuilderPageRouting: { data: null, error } }
            });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.inspectRouting(inspectParams)).rejects.toBe(failure);
        });
    });

    describe("folderExists", () => {
        it("sends the folder id only and ignores the folder type", async () => {
            const envelope = { data: true, error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: envelope }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "folder-1" });
            expect(request.query).toContain("query WebsiteBuilderPageFolderExists");
            expect(request.query).toContain("websiteBuilderPageFolderExists(id: $id)");
            expect(request.query).toContain("$id: ID!");
            expect(request.query).not.toContain("$type");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns false as an answer, not an error", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: false, error: null } }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: false, error: null });
        });

        it("returns a server error as an envelope and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: null, error } }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.folderExists(folderParams)).rejects.toBe(failure);
        });
    });

    describe("deleteWorkflow", () => {
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`.

Before:

```ts
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorFeature }
```

After:

```ts
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorFeature }
```

Before:

```ts
    it("runs the shared use cases over the WB gateway: the single Pages row", async () => {
```

After:

```ts
    it("runs the shared use cases over the WB gateway: the routing inspection without a model", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: {
                inspectWebsiteBuilderPageRouting: {
                    data: createRoutingInspectionDto({
                        ruleId: "rule-2",
                        narrowedTeamId: "team-2",
                        candidateIds: ["user-3"],
                        candidateCount: 4
                    }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "page"
        });

        expect(inspection.ruleId).toBe("rule-2");
        expect(inspection.narrowedTeamId).toBe("team-2");
        expect(inspection.candidateIds).toEqual(["user-3"]);
        expect(inspection.candidateCount).toBe(4);
        expect(client.execute.mock.calls[0][0].variables).not.toHaveProperty("modelId");
    });

    it("runs the shared use cases over the WB gateway: a deleted folder is false, not an error", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { websiteBuilderPageFolderExists: { data: false, error: null } }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const exists = await useCases.folderExists({ id: "folder-1", type: "wb:page" });

        expect(exists).toBe(false);
        expect(client.execute.mock.calls[0][0].variables).toEqual({ id: "folder-1" });
    });

    it("runs the shared use cases over the WB gateway: the single Pages row", async () => {
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx`.

Before:

```ts
    it("registers the WB workflow editor use cases with the flag on", () => {
```

After:

```ts
    it("sends the routing inspection of the editor through the WB gateway with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                inspectWebsiteBuilderPageRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCases = container.resolve(WbWorkflowEditorUseCases);
        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: null
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(lastRequest.query).toContain("inspectWebsiteBuilderPageRouting");
    });

    it("registers the WB workflow editor use cases with the flag on", () => {
```

- [ ] **Step 2: Run the new tests, expect failure**

```bash
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: FAIL. The gateway tests fail with `gateway.inspectRouting is not a function` and `gateway.folderExists is not a function`; the feature and root tests fail with `useCases.inspectRouting` / `folderExists` reaching a gateway without the method (`this.gateway.inspectRouting is not a function`).

- [ ] **Step 3: Implementation**

Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/inspectCmsEntryRouting.ts` (the argument list stays on one line so the test can assert the exact operation signature; the formatter leaves template-literal text alone):

```ts
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const INSPECT_CMS_ENTRY_ROUTING = /* GraphQL */ `
    query InspectCmsEntryRouting($stepConfig: JSON!, $modelId: ID!, $requesterId: ID!, $folderId: ID) {
        cms {
            inspectCmsEntryRouting(stepConfig: $stepConfig, modelId: $modelId, requesterId: $requesterId, folderId: $folderId) {
                data {
                    ${EDITOR_ROUTING_INSPECTION_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-headless-cms-workflows/src/features/editorGateway/graphql/cmsEntryFolderExists.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CMS_ENTRY_FOLDER_EXISTS = /* GraphQL */ `
    query CmsEntryFolderExists($id: ID!, $type: String!) {
        cms {
            cmsEntryFolderExists(id: $id, type: $type) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.ts`.

Before:

```ts
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

Before:

```ts
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { DELETE_CMS_ENTRY_WORKFLOW } from "./graphql/deleteCmsEntryWorkflow.js";
import { GET_CMS_ENTRY_WORKFLOW } from "./graphql/getCmsEntryWorkflow.js";
import { LIST_CMS_ENTRY_WORKFLOW_MODELS } from "./graphql/listCmsEntryWorkflowModels.js";
import { STORE_CMS_ENTRY_WORKFLOW } from "./graphql/storeCmsEntryWorkflow.js";
```

After:

```ts
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { CMS_ENTRY_FOLDER_EXISTS } from "./graphql/cmsEntryFolderExists.js";
import { DELETE_CMS_ENTRY_WORKFLOW } from "./graphql/deleteCmsEntryWorkflow.js";
import { GET_CMS_ENTRY_WORKFLOW } from "./graphql/getCmsEntryWorkflow.js";
import { INSPECT_CMS_ENTRY_ROUTING } from "./graphql/inspectCmsEntryRouting.js";
import { LIST_CMS_ENTRY_WORKFLOW_MODELS } from "./graphql/listCmsEntryWorkflowModels.js";
import { STORE_CMS_ENTRY_WORKFLOW } from "./graphql/storeCmsEntryWorkflow.js";
```

Before:

```ts
        return response.cms.deleteCmsEntryWorkflow;
    }
}
```

After:

```ts
        return response.cms.deleteCmsEntryWorkflow;
    }

    async inspectRouting(
        params: InspectRoutingParams
    ): Promise<EditorEnvelope<RoutingInspectionDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"inspectCmsEntryRouting", EditorEnvelope<RoutingInspectionDto>>
        >({
            query: INSPECT_CMS_ENTRY_ROUTING,
            variables: {
                stepConfig: params.stepConfig,
                modelId: params.modelId,
                requesterId: params.requesterId,
                folderId: params.folderId
            }
        });

        return response.cms.inspectCmsEntryRouting;
    }

    async folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>> {
        const response = await this.client.execute<
            CmsOperationResponse<"cmsEntryFolderExists", EditorEnvelope<boolean>>
        >({
            query: CMS_ENTRY_FOLDER_EXISTS,
            variables: { id: params.id, type: params.type }
        });

        return response.cms.cmsEntryFolderExists;
    }
}
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/inspectWebsiteBuilderPageRouting.ts`:

```ts
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const INSPECT_WEBSITE_BUILDER_PAGE_ROUTING = /* GraphQL */ `
    query InspectWebsiteBuilderPageRouting($stepConfig: JSON!, $requesterId: ID!, $folderId: ID) {
        websiteBuilder {
            inspectWebsiteBuilderPageRouting(stepConfig: $stepConfig, requesterId: $requesterId, folderId: $folderId) {
                data {
                    ${EDITOR_ROUTING_INSPECTION_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Create `packages/app-website-builder-workflows/src/features/editorGateway/graphql/websiteBuilderPageFolderExists.ts`:

```ts
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const WEBSITE_BUILDER_PAGE_FOLDER_EXISTS = /* GraphQL */ `
    query WebsiteBuilderPageFolderExists($id: ID!) {
        websiteBuilder {
            websiteBuilderPageFolderExists(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.ts`.

Before:

```ts
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

Before:

```ts
import { GET_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/getWebsiteBuilderPageWorkflow.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES } from "./graphql/listWebsiteBuilderPageWorkflowNames.js";
import { STORE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/storeWebsiteBuilderPageWorkflow.js";
```

After:

```ts
import { GET_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/getWebsiteBuilderPageWorkflow.js";
import { INSPECT_WEBSITE_BUILDER_PAGE_ROUTING } from "./graphql/inspectWebsiteBuilderPageRouting.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES } from "./graphql/listWebsiteBuilderPageWorkflowNames.js";
import { STORE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/storeWebsiteBuilderPageWorkflow.js";
import { WEBSITE_BUILDER_PAGE_FOLDER_EXISTS } from "./graphql/websiteBuilderPageFolderExists.js";
```

Before:

```ts
        return response.websiteBuilder.deleteWebsiteBuilderPageWorkflow;
    }
}
```

After:

```ts
        return response.websiteBuilder.deleteWebsiteBuilderPageWorkflow;
    }

    /*
     * Website Builder has one model and one folder type, so `modelId` is not sent: the schema has
     * no such argument (R291).
     */
    async inspectRouting(
        params: InspectRoutingParams
    ): Promise<EditorEnvelope<RoutingInspectionDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "inspectWebsiteBuilderPageRouting",
                EditorEnvelope<RoutingInspectionDto>
            >
        >({
            query: INSPECT_WEBSITE_BUILDER_PAGE_ROUTING,
            variables: {
                stepConfig: params.stepConfig,
                requesterId: params.requesterId,
                folderId: params.folderId
            }
        });

        return response.websiteBuilder.inspectWebsiteBuilderPageRouting;
    }

    // Page folders only, so the folder type is not sent (R291).
    async folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>> {
        const response = await this.client.execute<
            WbOperationResponse<"websiteBuilderPageFolderExists", EditorEnvelope<boolean>>
        >({
            query: WEBSITE_BUILDER_PAGE_FOLDER_EXISTS,
            variables: { id: params.id }
        });

        return response.websiteBuilder.websiteBuilderPageFolderExists;
    }
}
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/features 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages (the two gateway classes satisfy `IWorkflowEditorGateway` again). The existing `feature.test.ts` assertions (registrations, singletons) and the flag-on and flag-off root cases pass unchanged.

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
git commit -m "feat(app-headless-cms-workflows): add the routing inspection and folder check documents to both app gateways" -m "The CMS and Website Builder editor gateways send inspectRouting and folderExists over their own operations. The CMS sends the bare model id and the folder type, Website Builder sends neither. The inspection document selects every field of the extended answer." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **WB root name:** the contract and research write `wb.*`; the real root of the WB operations is `websiteBuilder` (`WbOperationResponse`, existing documents), so the WB documents and test fixtures use `websiteBuilder { ... }`. Operation names are the contract's.
- **`modelId: null` in the CMS** is not handled: the schema argument is `modelId: ID!` and the presenter (Task 14b) always sends the selected row's bare model id (R300); a `null` would be a programming error that the GraphQL layer rejects as a transport failure. No invented copy for it.
- **Template-literal documents:** the CMS and WB inspect documents keep the argument lists on one line each so the tests can assert the exact operation signature, as the existing `GetCmsEntryReviewStepRun` tests do; the repo formatter does not reflow GraphQL template text.
- **No new gateway test for `feature.ts`:** registrations are unchanged by this task, so `feature.test.ts` only gains behaviour cases (counts unchanged, as the contract says).
- Size: medium.

## Review fixes (sub-phase review)

- The CMS `feature.test.ts` import hunk now matches the file (a `createWorkflowModelRowDto` import sits between `createEditorWorkflowDto` and the gateway import).
- The two root tests (`index.test.tsx`) assert the last `execute` request, not the first: the mounted root may issue other requests during render, which made `calls[0]` unreliable.
- Two `expect(await gateway.folderExists(...))` assertions name the result first (no nested call arguments).
- Verified against the real schemas: `inspectCmsEntryRouting(stepConfig: JSON!, modelId: ID!, requesterId: ID!, folderId: ID)`, `cmsEntryFolderExists(id: ID!, type: String!)`, `inspectWebsiteBuilderPageRouting(stepConfig: JSON!, requesterId: ID!, folderId: ID)`, `websiteBuilderPageFolderExists(id: ID!)`; both inspection responses wrap the shared `WorkflowsRoutingInspection` that 9b.2 Task 4 extends.
