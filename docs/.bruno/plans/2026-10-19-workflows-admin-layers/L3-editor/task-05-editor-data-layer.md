### Task 5: Editor data layer and app gateways

R343, R344, R345, R346, R347, R348 (#10-#15), R349, R354, R355, R360; A113, A114, A117; Review Focus 1, 3, 6, 7 (`../00-shared.md`). Every Global Constraint of the plan applies (read: no behaviour change R342, Q76 naming with the R344 exception, one class or one public function per file, one named import per line, no inline object types, no nested call arguments, no wrapper helpers around dependency calls, namespace types `Foo.Interface` outside the declaring file, comments end with a period, the flag gate, one test command at a time, one commit). The 8a rulings R202, R204, R237, R238 and R243 still bind where this plan does not refine them (R237 no longer applies to the data layer, R347).

The editor gets the four layers. One app-neutral routing gateway, `WorkflowEditorGateway`, collects every app's editor gateway under the shared multi-registration token `WorkflowEditorAppGateway` and picks the one whose `app` equals the operation's `app`; it turns the envelope into the DTO or a thrown `GraphQLOperationError` once, for both apps. `WorkflowEditorRepository` maps the DTOs to the editor's domain types. Six use cases, one per operation, live once in `app-workflows`. `WorkflowAppKind` becomes the one app key of the three packages. Nothing consumes the new layer yet: the editor presenter keeps the per-app bundle until Task 6, and the CMS and WB gateways stay bound to their per-app tokens (only retyped), so this task changes no behaviour.

- **`WorkflowAppKind`** (`[AW]/domain/WorkflowAppKind.ts`): `export type WorkflowAppKind = "cms" | "wb";` It replaces `WorkflowEditorAppKind` (declared at `[AWE]/model/getStepTypeOptions.ts:8`) in its five files: `getStepTypeOptions.ts` (the declaration goes), `WorkflowEditorAppAdapter.ts`, `presentation/editor/duplicateBannerMessage.ts`, `testing/fakeEditorAppAdapter.ts`, `testing/editorPresenterSetup.ts`.
- **App gateway contract** (R345, R347): `git mv` `[AWE]/gateway/IWorkflowEditorGateway.ts` to `[AWE]/appGateway/IWorkflowEditorAppGateway.ts`; the interface becomes `IWorkflowEditorAppGateway` and gains `readonly app: WorkflowAppKind`; the four wire parameter types (`ListWorkflowModelsParams`, `StoreWorkflowParams`, `InspectRoutingParams`, `FolderExistsParams`) stay in it unchanged; the six envelope methods keep the R204 contract (resolve with the envelope, reject only on transport). New `[AWE]/appGateway/abstractions.ts`: token `WorkflowEditorAppGateway` = `"Workflows/WorkflowEditorAppGateway"`, namespace `Interface`. Every importer of the moved file is updated: `[AWE]/useCases/IWorkflowEditorUseCases.ts`, `WorkflowEditorUseCases.ts`, `WorkflowEditorUseCases.test.ts` (the bundle and its test stay until Task 6; the bundle's constructor takes `WorkflowEditorAppGateway.Interface`), the CMS and WB gateways, their per-app token files and their gateway tests.
- **Routing gateway** (R343, R346, R347, R349): `[AWE]/gateway/abstractions.ts` (the file Task 3 freed) declares `IWorkflowEditorGateway`, six methods named as the app gateway's, each taking its use case's `Params` (type-only imports) and returning the DTO (`WorkflowModelPageDto`, `EditorWorkflowDto`, `RoutingInspectionDto`) or `boolean`; token `"Workflows/WorkflowEditorGateway"`. `[AWE]/gateway/WorkflowEditorGateway.ts`: `dependencies: [[WorkflowEditorAppGateway, { multiple: true }]]`; private `forApp(app)` returns the first app gateway whose `app === app`, else throws `new Error(\`No workflows app is registered for "${app}".\`)`; each method calls the chosen app gateway with exactly its old parameter object, built field by field without `app` (`getWorkflow(params.id)`, `deleteWorkflow(params.id)`, `listModels({ search, limit, after })`, `storeWorkflow({ data, savedOn })`, `inspectRouting({ stepConfig, requesterId, folderId, modelId })`, `folderExists({ id, type })`), then `if (envelope.error || !envelope.data) { throw toOperationError(envelope.error); }` and returns `envelope.data`; `folderExists` uses `typeof envelope.data !== "boolean"` instead, so `false` is an answer. It never catches: a transport rejection and a plain `Error` of an app gateway reach the caller unchanged. A comment states R349.
- **Repository** (`[AWE]/repository/`): `IWorkflowEditorRepository` with the same six method names taking the use cases' `Params` and returning `WorkflowModelPage`, `EditorWorkflow`, `EditorWorkflow`, `EditorWorkflow`, `RoutingInspection`, `boolean`; token `"Workflows/WorkflowEditorRepository"`; `WorkflowEditorRepository.ts` maps with `mapWorkflowModelPage`, `mapEditorWorkflow`, `mapRoutingInspection` (they stay in `[AWE]/gateway/`) and passes `folderExists` through; `feature.ts` `WorkflowEditorRepositoryFeature` (name `Workflows/WorkflowEditorRepository`, no `resolve`) registers the routing gateway and the repository as singletons.
- **Use cases** (R344, R345, R348 #10-#15, R360): `[AWE]/useCases/{listWorkflowModels, getWorkflow, storeWorkflow, deleteWorkflow, inspectRouting, folderExists}/`, each `abstractions.ts` (`<Name>UseCaseParams`, interface, token `Workflows/<Name>UseCase`, namespace `Interface` and `Params`), `<Name>UseCase.ts` (transient, `dependencies: [WorkflowEditorRepository]`, one `execute` calling the repository method), `feature.ts` (`<Name>Feature`, name `Workflows/<Name>`, `resolve` `{ useCase }`), `<Name>UseCase.test.ts`. Params: `ListWorkflowModelsUseCaseParams extends ListWorkflowModelsParams { app }`, `GetWorkflowUseCaseParams { app; id }`, `StoreWorkflowUseCaseParams extends StoreWorkflowParams { app }`, `DeleteWorkflowUseCaseParams { app; id }`, `InspectRoutingUseCaseParams extends InspectRoutingParams { app }`, `FolderExistsUseCaseParams extends FolderExistsParams { app }`. Store and delete do not invalidate the workflow list yet (Task 10, R350).
- **Registration** (feature flag): `WorkflowEditorServicesFeature` (`[AWE]/feature.ts`) registers `WorkflowEditorRepositoryFeature` and the six use-case features beside what it registers after Task 3 (the config bridge and the toasts); its `resolve` stays `{ configUseCases, toasts }` (R364). `[AW]/app.test.tsx` resolves the eight new tokens with the flag on and fails to with it off.
- **CMS and WB** (R347, R351): `CmsWorkflowEditorGateway` and `WbWorkflowEditorGateway` gain `public readonly app: WorkflowAppKind` (`"cms"`, `"wb"`) and import the wire types from the moved file; they stay bound to their per-app tokens, whose interface becomes `WorkflowEditorAppGateway.Interface`, so the per-app bundles keep running unchanged until Task 6. Their app specifics (the CMS list reshape, the WB synthesized Pages row, the ignored `modelId` and folder type) stay where they are.
- `[AW]/app.cleanup.test.tsx`: `KEPT_PATHS` gains `domain/WorkflowAppKind.ts`.

**Files:**
- Create: `packages/app-workflows/src/domain/WorkflowAppKind.ts`
- Move and modify: `packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts` → `packages/app-workflows/src/editor/appGateway/IWorkflowEditorAppGateway.ts`
- Create: `packages/app-workflows/src/editor/appGateway/abstractions.ts`
- Create: `packages/app-workflows/src/editor/gateway/abstractions.ts`
- Create: `packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.ts`
- Create: `packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.test.ts`
- Create: `packages/app-workflows/src/editor/repository/abstractions.ts`
- Create: `packages/app-workflows/src/editor/repository/WorkflowEditorRepository.ts`
- Create: `packages/app-workflows/src/editor/repository/feature.ts`
- Create: `packages/app-workflows/src/editor/useCases/listWorkflowModels/{abstractions.ts, ListWorkflowModelsUseCase.ts, feature.ts, ListWorkflowModelsUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/useCases/getWorkflow/{abstractions.ts, GetWorkflowUseCase.ts, feature.ts, GetWorkflowUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/useCases/storeWorkflow/{abstractions.ts, StoreWorkflowUseCase.ts, feature.ts, StoreWorkflowUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/useCases/deleteWorkflow/{abstractions.ts, DeleteWorkflowUseCase.ts, feature.ts, DeleteWorkflowUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/useCases/inspectRouting/{abstractions.ts, InspectRoutingUseCase.ts, feature.ts, InspectRoutingUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/useCases/folderExists/{abstractions.ts, FolderExistsUseCase.ts, feature.ts, FolderExistsUseCase.test.ts}`
- Create: `packages/app-workflows/src/editor/testing/fakeWorkflowEditorAppGateway.ts`
- Create: `packages/app-workflows/src/editor/testing/fakeWorkflowEditorGateway.ts`
- Modify: `packages/app-workflows/src/editor/feature.ts`
- Modify: `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`
- Modify: `packages/app-workflows/src/editor/model/getStepTypeOptions.ts`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts`
- Modify: `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/abstractions.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/abstractions.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts`

**Interfaces:**
- Consumes (verified at HEAD with codegraph and the source): `createAbstraction`, `createFeature` (`@webiny/feature/admin`); `Container` (`@webiny/di` 2.0.0: `registerInstance`, `register(...).inSingletonScope()`, `resolve`, `resolveAll`; `[[Token, { multiple: true }]]` resolves every registration, instances first, in registration order, `node_modules/@webiny/di/dist/index.js` `resolveMultiple`); `GraphQLOperationError` (`@webiny/app/errors/index.js`); `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`); DTOs `EditorEnvelope`, `EditorWorkflowDto`, `RoutingInspectionDto`, `WorkflowModelPageDto` (`[AWE]/gateway/dto.ts`); mappers `mapWorkflowModelPage` (`[AWE]/gateway/mapWorkflowModelPage.ts:16`), `mapEditorWorkflow` (`mapEditorWorkflow.ts:22`), `mapRoutingInspection` (`mapRoutingInspection.ts:37`); domain `EditorWorkflow`, `EditorWorkflowInput`, `RoutingInspection`, `RoutingStepConfig`, `WorkflowModelPage` (`[AWE]/domain/types.ts`); `WorkflowErrorCode` (`[AWE]/domain/WorkflowErrorCode.ts`); fixtures `EDITOR_SAVED_ON`, `createEditorWorkflow`, `createEditorWorkflowDto`, `createRoutingInspection`, `createRoutingInspectionDto`, `createWorkflowModelPageDto`, `createWorkflowModelRowDto` (`[AWET]/editorFixtures.ts`). From Task 1: `toOperationError(error: EditorErrorDto | null): GraphQLOperationError` at `[AW]/gateway/toOperationError.ts` (message `error?.message ?? "The request failed."`, `code ?? null`, `data ?? null`). From Task 3: `[AWE]/gateway/abstractions.ts` no longer exists (the config gateway token moved to `[AWC]/gateway/abstractions.ts`), `[AWE]/feature.ts` registers the config bridge `WorkflowConfigUseCases` and `WorkflowEditorToasts` and resolves `{ configUseCases, toasts }`.
- Produces (matches the contract): `WorkflowAppKind`; `WorkflowEditorAppGateway` (`Workflows/WorkflowEditorAppGateway`, `IWorkflowEditorAppGateway` with `readonly app` and the six envelope methods, the four wire parameter types); `WorkflowEditorGateway` (`Workflows/WorkflowEditorGateway`); `WorkflowEditorRepository` (`Workflows/WorkflowEditorRepository`), `WorkflowEditorRepositoryFeature`; `ListWorkflowModelsUseCase`, `GetWorkflowUseCase`, `StoreWorkflowUseCase`, `DeleteWorkflowUseCase`, `InspectRoutingUseCase`, `FolderExistsUseCase` with their `Params` and `<Name>Feature`s; test fakes `createFakeEditorAppGateway(app)` / `FakeWorkflowEditorAppGateway` and `createFakeEditorGateway()` / `FakeWorkflowEditorGateway`. Consumed by Task 6 (presenter, CMS and WB bindings), Task 7 (`WorkflowAppKind`), Task 10 (store and delete add the invalidation).

**Test runner note:** admin packages, `yarn test <path>` only, one file per command, and the commands of each block run one at a time, in order.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/fakeWorkflowEditorAppGateway.ts` (a vitest fake, R243: separate from the pure builders):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorAppGateway extends WorkflowEditorAppGateway.Interface {
    listModels: Mock<WorkflowEditorAppGateway.Interface["listModels"]>;
    getWorkflow: Mock<WorkflowEditorAppGateway.Interface["getWorkflow"]>;
    storeWorkflow: Mock<WorkflowEditorAppGateway.Interface["storeWorkflow"]>;
    deleteWorkflow: Mock<WorkflowEditorAppGateway.Interface["deleteWorkflow"]>;
    inspectRouting: Mock<WorkflowEditorAppGateway.Interface["inspectRouting"]>;
    folderExists: Mock<WorkflowEditorAppGateway.Interface["folderExists"]>;
}

/*
 * One app's editor gateway as a test double. Every method resolves a success envelope: the default
 * model page, the default workflow, the default routing inspection and `true` for a folder.
 * Tests override single methods with `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeEditorAppGateway = (app: WorkflowAppKind): FakeWorkflowEditorAppGateway => {
    const page = createWorkflowModelPageDto();
    const workflow = createEditorWorkflowDto();
    const inspection = createRoutingInspectionDto();
    return {
        app,
        listModels: vi.fn().mockResolvedValue({ data: page, error: null }),
        getWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        storeWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        deleteWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        inspectRouting: vi.fn().mockResolvedValue({ data: inspection, error: null }),
        folderExists: vi.fn().mockResolvedValue({ data: true, error: null })
    };
};
```

Create `packages/app-workflows/src/editor/testing/fakeWorkflowEditorGateway.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorGateway extends WorkflowEditorGateway.Interface {
    listModels: Mock<WorkflowEditorGateway.Interface["listModels"]>;
    getWorkflow: Mock<WorkflowEditorGateway.Interface["getWorkflow"]>;
    storeWorkflow: Mock<WorkflowEditorGateway.Interface["storeWorkflow"]>;
    deleteWorkflow: Mock<WorkflowEditorGateway.Interface["deleteWorkflow"]>;
    inspectRouting: Mock<WorkflowEditorGateway.Interface["inspectRouting"]>;
    folderExists: Mock<WorkflowEditorGateway.Interface["folderExists"]>;
}

/*
 * The editor's area gateway as a test double for the use-case tests (R355): it answers DTOs, as
 * the routing gateway does after unwrapping. Defaults: the default model page, workflow and routing
 * inspection, and `true` for a folder.
 */
export const createFakeEditorGateway = (): FakeWorkflowEditorGateway => {
    const page = createWorkflowModelPageDto();
    const workflow = createEditorWorkflowDto();
    const inspection = createRoutingInspectionDto();
    return {
        listModels: vi.fn().mockResolvedValue(page),
        getWorkflow: vi.fn().mockResolvedValue(workflow),
        storeWorkflow: vi.fn().mockResolvedValue(workflow),
        deleteWorkflow: vi.fn().mockResolvedValue(workflow),
        inspectRouting: vi.fn().mockResolvedValue(inspection),
        folderExists: vi.fn().mockResolvedValue(true)
    };
};
```

Create `packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.test.ts` (R355 routing-gateway test; Review Focus 1, 3, 7; the error-mapping cases of `WorkflowEditorUseCases.test.ts` move here because the routing gateway now converts the envelope):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "~/editor/testing/fakeWorkflowEditorAppGateway.js";
import type { FakeWorkflowEditorAppGateway } from "~/editor/testing/fakeWorkflowEditorAppGateway.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import { WorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowEditorGateway } from "./WorkflowEditorGateway.js";

type AppGatewayMethod = Exclude<keyof WorkflowEditorAppGateway.Interface, "app">;

interface OperationCase {
    name: AppGatewayMethod;
    run: (gateway: GatewayAbstraction.Interface, app: WorkflowAppKind) => Promise<unknown>;
}

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

const storeParams: StoreWorkflowUseCase.Params = {
    app: "cms",
    data: input,
    savedOn: EDITOR_SAVED_ON
};

const inspectParams: InspectRoutingUseCase.Params = {
    app: "cms",
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const operationCases: OperationCase[] = [
    {
        name: "listModels",
        run: (gateway, app) => gateway.listModels({ app, search: "art", limit: 20, after: null })
    },
    {
        name: "getWorkflow",
        run: (gateway, app) => gateway.getWorkflow({ app, id: "workflow-1" })
    },
    {
        name: "storeWorkflow",
        run: (gateway, app) => gateway.storeWorkflow({ app, data: input, savedOn: null })
    },
    {
        name: "deleteWorkflow",
        run: (gateway, app) => gateway.deleteWorkflow({ app, id: "workflow-1" })
    },
    {
        name: "inspectRouting",
        run: (gateway, app) => {
            return gateway.inspectRouting({
                app,
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: null,
                modelId: "article"
            });
        }
    },
    {
        name: "folderExists",
        run: (gateway, app) => gateway.folderExists({ app, id: "folder-1", type: "cms:article" })
    }
];

const createGateway = (appGateways: FakeWorkflowEditorAppGateway[]): GatewayAbstraction.Interface => {
    const container = new Container();
    for (const appGateway of appGateways) {
        container.registerInstance(WorkflowEditorAppGateway, appGateway);
    }
    container.register(WorkflowEditorGateway).inSingletonScope();
    return container.resolve(GatewayAbstraction);
};

const conflictError: EditorErrorDto = {
    code: WorkflowErrorCode.Conflict,
    message: "The workflow was changed by Grace Hopper.",
    data: { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { id: "user-2", displayName: "Grace" } }
};

describe("WorkflowEditorGateway", () => {
    describe("routing by app (R347, R348)", () => {
        it.each(operationCases)("$name goes to the CMS gateway for app cms", async operationCase => {
            const cms = createFakeEditorAppGateway("cms");
            const wb = createFakeEditorAppGateway("wb");
            const gateway = createGateway([cms, wb]);

            await operationCase.run(gateway, "cms");

            expect(cms[operationCase.name]).toHaveBeenCalledTimes(1);
            expect(wb[operationCase.name]).not.toHaveBeenCalled();
        });

        it.each(operationCases)("$name goes to the WB gateway for app wb", async operationCase => {
            const cms = createFakeEditorAppGateway("cms");
            const wb = createFakeEditorAppGateway("wb");
            const gateway = createGateway([cms, wb]);

            await operationCase.run(gateway, "wb");

            expect(wb[operationCase.name]).toHaveBeenCalledTimes(1);
            expect(cms[operationCase.name]).not.toHaveBeenCalled();
        });

        it.each(operationCases)(
            "$name throws a plain Error for an app nobody registered and calls no gateway",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "wb");

                await expect(promise).rejects.toThrow('No workflows app is registered for "wb".');
                await expect(promise).rejects.not.toBeInstanceOf(GraphQLOperationError);
                expect(cms[operationCase.name]).not.toHaveBeenCalled();
            }
        );

        it("uses the first registered gateway of an app registered twice, once (A114)", async () => {
            const first = createFakeEditorAppGateway("cms");
            const second = createFakeEditorAppGateway("cms");
            const firstWorkflow = createEditorWorkflowDto({ id: "workflow-first" });
            first.getWorkflow.mockResolvedValue({ data: firstWorkflow, error: null });
            const gateway = createGateway([first, second]);

            const workflow = await gateway.getWorkflow({ app: "cms", id: "workflow-first" });

            expect(workflow.id).toBe("workflow-first");
            expect(first.getWorkflow).toHaveBeenCalledTimes(1);
            expect(second.getWorkflow).not.toHaveBeenCalled();
        });
    });

    describe("the app gateway receives exactly its old parameters (R347)", () => {
        it("listModels sends search, limit and after without the app", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.listModels({ app: "cms", search: "art", limit: 20, after: "cursor-1" });

            expect(cms.listModels).toHaveBeenCalledWith({
                search: "art",
                limit: 20,
                after: "cursor-1"
            });
        });

        it("getWorkflow and deleteWorkflow send the id alone", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.getWorkflow({ app: "cms", id: "workflow-1" });
            await gateway.deleteWorkflow({ app: "cms", id: "workflow-2" });

            expect(cms.getWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(cms.deleteWorkflow).toHaveBeenCalledWith("workflow-2");
        });

        it("storeWorkflow sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.storeWorkflow(storeParams);

            expect(cms.storeWorkflow).toHaveBeenCalledWith({ data: input, savedOn: EDITOR_SAVED_ON });
            const sent = cms.storeWorkflow.mock.calls[0][0];
            expect(sent.data).toBe(input);
            expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
        });

        it("storeWorkflow sends null for a new workflow", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.storeWorkflow({ app: "cms", data: input, savedOn: null });

            expect(cms.storeWorkflow).toHaveBeenCalledWith({ data: input, savedOn: null });
        });

        it("inspectRouting sends the step config, requester, folder and model", async () => {
            const wb = createFakeEditorAppGateway("wb");
            const gateway = createGateway([wb]);

            await gateway.inspectRouting({ ...inspectParams, app: "wb" });

            expect(wb.inspectRouting).toHaveBeenCalledWith({
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: "folder-1",
                modelId: "article"
            });
        });

        it("folderExists sends the id and the folder type", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.folderExists({ app: "cms", id: "folder-1", type: "cms:article" });

            expect(cms.folderExists).toHaveBeenCalledWith({ id: "folder-1", type: "cms:article" });
        });
    });

    describe("unwrapping (R346)", () => {
        it("returns the DTOs of the envelope as they are", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const page = createWorkflowModelPageDto();
            const workflow = createEditorWorkflowDto();
            const inspection = createRoutingInspectionDto({ ruleId: "rule-2" });
            cms.listModels.mockResolvedValue({ data: page, error: null });
            cms.getWorkflow.mockResolvedValue({ data: workflow, error: null });
            cms.inspectRouting.mockResolvedValue({ data: inspection, error: null });
            const gateway = createGateway([cms]);

            const listed = await gateway.listModels({
                app: "cms",
                search: "",
                limit: 20,
                after: null
            });
            const loaded = await gateway.getWorkflow({ app: "cms", id: "workflow-1" });
            const inspected = await gateway.inspectRouting(inspectParams);

            expect(listed).toBe(page);
            expect(loaded).toBe(workflow);
            expect(inspected).toBe(inspection);
        });

        it("answers false for a deleted folder and does not throw", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.folderExists.mockResolvedValue({ data: false, error: null });
            const gateway = createGateway([cms]);

            const exists = await gateway.folderExists({
                app: "cms",
                id: "folder-1",
                type: "cms:article"
            });

            expect(exists).toBe(false);
        });

        it("throws when the folder answer is missing (undefined), instead of reading it as a deleted folder", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.folderExists.mockResolvedValue({ data: undefined, error: null } as never);
            const gateway = createGateway([cms]);

            const promise = gateway.folderExists({ app: "cms", id: "folder-1", type: "cms:article" });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({ message: "The request failed." });
        });

        it.each(operationCases)(
            "$name throws a GraphQLOperationError that keeps code, message and data",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const method: Mock = cms[operationCase.name];
                method.mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotFound,
                        message: "No workflow.",
                        data: { id: "workflow-1" }
                    }
                });
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "cms");

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotFound,
                    message: "No workflow.",
                    data: { id: "workflow-1" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback when the server answers with neither data nor error",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const method: Mock = cms[operationCase.name];
                method.mockResolvedValue({ data: null, error: null });
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "cms");

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
                const cms = createFakeEditorAppGateway("cms");
                const failure = new Error("Network down.");
                const method: Mock = cms[operationCase.name];
                method.mockRejectedValue(failure);
                const gateway = createGateway([cms]);

                await expect(operationCase.run(gateway, "cms")).rejects.toBe(failure);
            }
        );

        it("throws a conflict that keeps the code and the savedOn and savedBy of the other save", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.storeWorkflow.mockResolvedValue({ data: null, error: conflictError });
            const gateway = createGateway([cms]);

            const promise = gateway.storeWorkflow(storeParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Conflict,
                message: "The workflow was changed by Grace Hopper.",
                data: conflictError.data
            });
        });

        it("throws the validation error of a store with the rule id the server named (R288)", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "r-1"
            };
            const cms = createFakeEditorAppGateway("cms");
            cms.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });
            const gateway = createGateway([cms]);

            const promise = gateway.storeWorkflow(storeParams);

            await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Validation, data });
        });

        it("throws a blocked delete that keeps the count and the reviews", async () => {
            const data = {
                count: 2,
                reviews: [{ reviewId: "review-1", title: "Spring campaign" }]
            };
            const wb = createFakeEditorAppGateway("wb");
            wb.deleteWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.HasActiveReviews,
                    message: "The workflow has reviews in progress.",
                    data
                }
            });
            const gateway = createGateway([wb]);

            const promise = gateway.deleteWorkflow({ app: "wb", id: "workflow-1" });

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });

        it("lets a plain Error of an app gateway pass as it is", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const failure = new Error("Invalid app name.");
            cms.inspectRouting.mockRejectedValue(failure);
            const gateway = createGateway([cms]);

            await expect(gateway.inspectRouting(inspectParams)).rejects.toBe(failure);
        });
    });
});
```

Create `packages/app-workflows/src/editor/useCases/listWorkflowModels/ListWorkflowModelsUseCase.test.ts` (R355: the fake area gateway, the real repository; ported from `WorkflowEditorUseCases.test.ts` "listModels"):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowModelsUseCase } from "./ListWorkflowModelsUseCase.js";

const params: UseCaseAbstraction.Params = { app: "cms", search: "art", limit: 20, after: "cursor-1" };

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(ListWorkflowModelsUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("ListWorkflowModelsUseCase", () => {
    it("passes the params with the app untouched and maps the rows with the page meta", async () => {
        const gateway = createFakeEditorGateway();
        const articleRow = createWorkflowModelRowDto();
        const authorRow = createWorkflowModelRowDto({
            model: "cms.author",
            modelId: "author",
            name: "Author",
            workflow: null
        });
        const pageDto = createWorkflowModelPageDto({
            rows: [articleRow, authorRow],
            meta: { cursor: "cursor-2", hasMoreItems: true }
        });
        gateway.listModels.mockResolvedValue(pageDto);
        const useCase = createUseCase(gateway);

        const page = await useCase.execute(params);

        expect(gateway.listModels).toHaveBeenCalledTimes(1);
        expect(gateway.listModels.mock.calls[0][0]).toBe(params);
        expect(page.cursor).toBe("cursor-2");
        expect(page.hasMoreItems).toBe(true);
        expect(page.rows.map(row => row.model)).toEqual(["cms.article", "cms.author"]);
        expect(page.rows[1].workflow).toBeNull();
    });

    it("lets the gateway's error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "Not allowed.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listModels.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/editor/useCases/getWorkflow/GetWorkflowUseCase.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(GetWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("GetWorkflowUseCase", () => {
    it("asks for the workflow of the app by id and maps it", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createEditorWorkflowDto();
        gateway.getWorkflow.mockResolvedValue(dto);
        const expected = createEditorWorkflow();
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "wb", id: "workflow-1" });

        expect(gateway.getWorkflow).toHaveBeenCalledWith({ app: "wb", id: "workflow-1" });
        expect(workflow).toEqual(expected);
    });

    it("keeps the savedOn string as the server sent it (D131)", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30.123Z" });
        gateway.getWorkflow.mockResolvedValue(dto);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "cms", id: "workflow-1" });

        expect(workflow.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("lets the gateway's error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "No workflow.",
            code: WorkflowErrorCode.NotFound,
            data: { id: "workflow-1" }
        });
        gateway.getWorkflow.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute({ app: "cms", id: "workflow-1" })).rejects.toBe(failure);
    });

    it("is transient: every resolve is a new instance", () => {
        const gateway = createFakeEditorGateway();
        const container = new Container();
        container.registerInstance(WorkflowEditorGateway, gateway);
        container.register(WorkflowEditorRepository).inSingletonScope();
        container.register(GetWorkflowUseCase);

        expect(container.resolve(UseCaseAbstraction)).not.toBe(container.resolve(UseCaseAbstraction));
    });
});
```

Create `packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts` (ported "storeWorkflow" cases; the invalidation cases come with Task 10):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

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

const params: UseCaseAbstraction.Params = { app: "cms", data: input, savedOn: EDITOR_SAVED_ON };

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(StoreWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("StoreWorkflowUseCase", () => {
    it("sends the data and the loaded savedOn string unchanged with the app (D131)", async () => {
        const gateway = createFakeEditorGateway();
        const useCase = createUseCase(gateway);

        await useCase.execute(params);

        expect(gateway.storeWorkflow).toHaveBeenCalledTimes(1);
        const sent = gateway.storeWorkflow.mock.calls[0][0];
        expect(sent).toBe(params);
        expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("sends null for a new workflow", async () => {
        const gateway = createFakeEditorGateway();
        const useCase = createUseCase(gateway);

        await useCase.execute({ app: "wb", data: input, savedOn: null });

        const sent = gateway.storeWorkflow.mock.calls[0][0];
        expect(sent.savedOn).toBeNull();
        expect(sent.app).toBe("wb");
    });

    it("returns the stored workflow with the new savedOn string unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const stored = createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" });
        gateway.storeWorkflow.mockResolvedValue(stored);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute(params);

        expect(workflow.savedOn).toBe("2026-10-18T11:30:00.456Z");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const gateway = createFakeEditorGateway();
        const conflict = new GraphQLOperationError({
            message: "The workflow was changed by Grace Hopper.",
            code: WorkflowErrorCode.Conflict,
            data: { savedOn: "2026-10-18T10:00:00.000Z" }
        });
        gateway.storeWorkflow.mockRejectedValue(conflict);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(conflict);
    });
});
```

Create `packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(DeleteWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("DeleteWorkflowUseCase", () => {
    it("deletes the workflow of the app by id and maps the deleted workflow", async () => {
        const gateway = createFakeEditorGateway();
        const deleted = createEditorWorkflowDto({ id: "workflow-1" });
        gateway.deleteWorkflow.mockResolvedValue(deleted);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "cms", id: "workflow-1" });

        expect(gateway.deleteWorkflow).toHaveBeenCalledWith({ app: "cms", id: "workflow-1" });
        expect(workflow.id).toBe("workflow-1");
    });

    it("lets a blocked delete pass unchanged, with the count and the reviews", async () => {
        const gateway = createFakeEditorGateway();
        const blocked = new GraphQLOperationError({
            message: "The workflow has reviews in progress.",
            code: WorkflowErrorCode.HasActiveReviews,
            data: { count: 2, reviews: [{ reviewId: "review-1", title: "Spring campaign" }] }
        });
        gateway.deleteWorkflow.mockRejectedValue(blocked);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(blocked);
    });
});
```

Create `packages/app-workflows/src/editor/useCases/inspectRouting/InspectRoutingUseCase.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { RoutingTraceEntryDto } from "~/editor/gateway/dto.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

const params: UseCaseAbstraction.Params = {
    app: "cms",
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const dtoTrace: RoutingTraceEntryDto[] = [
    { ruleId: "rule-1", outcome: "notMatched", reason: null, failedConditions: ["folder"] },
    { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
];

const trace: RoutingTraceEntry[] = [
    { ruleId: "rule-1", outcome: "notMatched", reason: null, failedConditions: ["folder"] },
    { ruleId: "rule-2", outcome: "notEvaluated", reason: null, failedConditions: [] }
];

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(InspectRoutingUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("InspectRoutingUseCase", () => {
    it("passes the params untouched and maps the inspection", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createRoutingInspectionDto({
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4"],
            candidateCount: 5,
            trace: dtoTrace
        });
        gateway.inspectRouting.mockResolvedValue(dto);
        const expected = createRoutingInspection({
            narrowedTeamId: "team-2",
            candidateIds: ["user-3", "user-4"],
            candidateCount: 5,
            trace
        });
        const useCase = createUseCase(gateway);

        const inspection = await useCase.execute(params);

        expect(gateway.inspectRouting.mock.calls[0][0]).toBe(params);
        expect(inspection).toEqual(expected);
    });

    it("lets a rule validation error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "The target team is not one of the step's reviewing teams.",
            code: WorkflowErrorCode.Validation,
            data: { stepId: "step-1", ruleId: "rule-1" }
        });
        gateway.inspectRouting.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/editor/useCases/folderExists/FolderExistsUseCase.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderExistsUseCase } from "./FolderExistsUseCase.js";

const params: UseCaseAbstraction.Params = { app: "cms", id: "folder-1", type: "cms:article" };

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(FolderExistsUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("FolderExistsUseCase", () => {
    it("passes the params untouched and answers true for a folder that exists", async () => {
        const gateway = createFakeEditorGateway();
        gateway.folderExists.mockResolvedValue(true);
        const useCase = createUseCase(gateway);

        const exists = await useCase.execute(params);

        expect(gateway.folderExists.mock.calls[0][0]).toBe(params);
        expect(exists).toBe(true);
    });

    it("answers false for a deleted folder", async () => {
        const gateway = createFakeEditorGateway();
        gateway.folderExists.mockResolvedValue(false);
        const useCase = createUseCase(gateway);

        const exists = await useCase.execute(params);

        expect(exists).toBe(false);
    });

    it("lets a transport failure pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new Error("Network down.");
        gateway.folderExists.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx` (Review Focus 6). Add these imports directly after the line `import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";`:

```ts
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
```

Append at the end of the file:

```tsx

describe("WorkflowsAdminApp workflow editor data layer", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the editor routing gateway and repository as singletons when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowEditorGateway)).toBe(
            container.resolve(WorkflowEditorGateway)
        );
        expect(container.resolve(WorkflowEditorRepository)).toBe(
            container.resolve(WorkflowEditorRepository)
        );
    });

    it("registers the six editor use cases transient when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(ListWorkflowModelsUseCase)).not.toBe(
            container.resolve(ListWorkflowModelsUseCase)
        );
        expect(container.resolve(GetWorkflowUseCase)).not.toBe(
            container.resolve(GetWorkflowUseCase)
        );
        expect(container.resolve(StoreWorkflowUseCase)).not.toBe(
            container.resolve(StoreWorkflowUseCase)
        );
        expect(container.resolve(DeleteWorkflowUseCase)).not.toBe(
            container.resolve(DeleteWorkflowUseCase)
        );
        expect(container.resolve(InspectRoutingUseCase)).not.toBe(
            container.resolve(InspectRoutingUseCase)
        );
        expect(container.resolve(FolderExistsUseCase)).not.toBe(
            container.resolve(FolderExistsUseCase)
        );
    });

    it("registers none of the editor data layer when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowEditorGateway)).toThrow();
        expect(() => container.resolve(WorkflowEditorRepository)).toThrow();
        expect(() => container.resolve(ListWorkflowModelsUseCase)).toThrow();
        expect(() => container.resolve(GetWorkflowUseCase)).toThrow();
        expect(() => container.resolve(StoreWorkflowUseCase)).toThrow();
        expect(() => container.resolve(DeleteWorkflowUseCase)).toThrow();
        expect(() => container.resolve(InspectRoutingUseCase)).toThrow();
        expect(() => container.resolve(FolderExistsUseCase)).toThrow();
    });
});
```

(`mount`, `flags`, `cleanup`, `beforeEach`, `afterEach` already exist in the file; verify that `mount` still has its HEAD signature `mount(flagOn: boolean): Container` after Tasks 1-4.)

Modify `packages/app-workflows/src/app.cleanup.test.tsx`:

Before:

```ts
const KEPT_PATHS = [
    "domain/permissions",
```

After:

```ts
const KEPT_PATHS = [
    "domain/permissions",
    "domain/WorkflowAppKind.ts",
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/listWorkflowModels/ListWorkflowModelsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/getWorkflow/GetWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/inspectRouting/InspectRoutingUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/folderExists/FolderExistsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
```

Expected: the seven new files fail to load (`Failed to resolve import` of `~/editor/appGateway/abstractions.js`, `./abstractions.js`, `~/editor/repository/WorkflowEditorRepository.js` or `~/editor/testing/fakeWorkflowEditorGateway.js`'s imports); `app.test.tsx` fails to load `~/editor/gateway/abstractions.js` (Task 3 moved the config token away, so the file does not exist); `app.cleanup.test.tsx` fails on `domain/WorkflowAppKind.ts is kept`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/domain/WorkflowAppKind.ts`:

```ts
// The workflows app a workflow, a review list or an editor belongs to: Headless CMS or Website Builder (R345, R347).
export type WorkflowAppKind = "cms" | "wb";
```

Modify `packages/app-workflows/src/editor/model/getStepTypeOptions.ts`:

Before:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
```

Before:

```ts
export type WorkflowEditorAppKind = "cms" | "wb";

export interface StepTypeOptionsParams {
    stepTypes: EditorStepType[];
    automations: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`.
    namespace: string;
    appKind: WorkflowEditorAppKind;
}
```

After:

```ts
export interface StepTypeOptionsParams {
    stepTypes: EditorStepType[];
    automations: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`.
    namespace: string;
    appKind: WorkflowAppKind;
}
```

Modify `packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts`:

Before:

```ts
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
export interface WorkflowEditorAppAdapter {
    appKind: WorkflowEditorAppKind;
```

After:

```ts
export interface WorkflowEditorAppAdapter {
    // The app the editor serves; the editor use cases route by it (R348, A117).
    appKind: WorkflowAppKind;
```

Modify `packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.ts`:

Before:

```ts
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
    appKind: WorkflowEditorAppKind;
```

After:

```ts
    appKind: WorkflowAppKind;
```

Modify `packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts`:

Before:

```ts
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
export const createFakeAppAdapter = (kind: WorkflowEditorAppKind = "cms"): FakeEditorAppAdapter => {
```

After:

```ts
export const createFakeAppAdapter = (kind: WorkflowAppKind = "cms"): FakeEditorAppAdapter => {
```

Modify `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts` (two lines; the rest is Task 4's):

Before:

```ts
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
    appKind?: WorkflowEditorAppKind;
```

After:

```ts
    appKind?: WorkflowAppKind;
```

Move the app gateway contract:

```bash
mkdir -p packages/app-workflows/src/editor/appGateway
git mv packages/app-workflows/src/editor/gateway/IWorkflowEditorGateway.ts packages/app-workflows/src/editor/appGateway/IWorkflowEditorAppGateway.ts
```

Replace the content of `packages/app-workflows/src/editor/appGateway/IWorkflowEditorAppGateway.ts` with:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import type { RoutingStepConfig } from "~/editor/domain/types.js";

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

export interface InspectRoutingParams {
    // `{ teams, assignment }` exactly as `toStepInput` emits it for the draft step (R300).
    stepConfig: RoutingStepConfig;
    requesterId: string;
    // `null` is the root. The CMS sends it as an omitted folder, the WB too.
    folderId: string | null;
    // The bare model id (R300); the CMS sends it, the WB ignores it.
    modelId: string | null;
}

export interface FolderExistsParams {
    id: string;
    // The rule folder's own `type` (R292); the WB ignores it (its type is always `wb:page`).
    type: string;
}

/*
 * The workflow operations one app exposes over its own GraphQL documents (R202, R347). `app` is
 * the key the routing `WorkflowEditorGateway` picks the app by. Every method resolves with the
 * shared envelope, also when the server reports an error, and rejects only on a transport failure
 * (R204); the routing gateway unwraps the envelope once for every app (R346). Each app registers
 * its implementation under the shared `WorkflowEditorAppGateway` token (`./abstractions.ts`).
 */
export interface IWorkflowEditorAppGateway {
    readonly app: WorkflowAppKind;
    listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>;
    getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>;
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    inspectRouting(params: InspectRoutingParams): Promise<EditorEnvelope<RoutingInspectionDto>>;
    folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>>;
}
```

Create `packages/app-workflows/src/editor/appGateway/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorAppGateway } from "./IWorkflowEditorAppGateway.js";

/*
 * One app's editor gateway. Every app registers its own class under this one token (R347):
 * `container.register(CmsWorkflowEditorGateway).inSingletonScope()` in the CMS, the WB the same,
 * so both coexist and the routing `WorkflowEditorGateway` receives them all.
 */
export const WorkflowEditorAppGateway = createAbstraction<IWorkflowEditorAppGateway>(
    "Workflows/WorkflowEditorAppGateway"
);

export namespace WorkflowEditorAppGateway {
    export type Interface = IWorkflowEditorAppGateway;
}
```

Create `packages/app-workflows/src/editor/useCases/listWorkflowModels/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

export interface ListWorkflowModelsUseCaseParams extends ListWorkflowModelsParams {
    // The app whose models the editor lists; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * One page of the app's models with the workflow bound to each. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
 */
export interface IListWorkflowModelsUseCase {
    execute(params: ListWorkflowModelsUseCaseParams): Promise<WorkflowModelPage>;
}

export const ListWorkflowModelsUseCase = createAbstraction<IListWorkflowModelsUseCase>(
    "Workflows/ListWorkflowModelsUseCase"
);

export namespace ListWorkflowModelsUseCase {
    export type Interface = IListWorkflowModelsUseCase;
    export type Params = ListWorkflowModelsUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/useCases/getWorkflow/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface GetWorkflowUseCaseParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
    id: string;
}

/*
 * One workflow by id. Throws a `GraphQLOperationError` for a server error (its `code` is a
 * `WorkflowErrorCode`) and the transport `Error` as is (R360).
 */
export interface IGetWorkflowUseCase {
    execute(params: GetWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>(
    "Workflows/GetWorkflowUseCase"
);

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Params = GetWorkflowUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/useCases/storeWorkflow/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface StoreWorkflowUseCaseParams extends StoreWorkflowParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * Stores a new or a changed workflow and resolves with the stored one. Throws a
 * `GraphQLOperationError` for a server error (a conflict, a validation error, a duplicate binding)
 * and the transport `Error` as is (R360).
 */
export interface IStoreWorkflowUseCase {
    execute(params: StoreWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const StoreWorkflowUseCase = createAbstraction<IStoreWorkflowUseCase>(
    "Workflows/StoreWorkflowUseCase"
);

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Params = StoreWorkflowUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/useCases/deleteWorkflow/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

export interface DeleteWorkflowUseCaseParams {
    // The app the workflow belongs to; the operation routes by it (R348).
    app: WorkflowAppKind;
    id: string;
}

/*
 * Deletes one workflow and resolves with the deleted one. Throws a `GraphQLOperationError` for a
 * server error (a workflow in use, one already gone) and the transport `Error` as is (R360).
 */
export interface IDeleteWorkflowUseCase {
    execute(params: DeleteWorkflowUseCaseParams): Promise<EditorWorkflow>;
}

export const DeleteWorkflowUseCase = createAbstraction<IDeleteWorkflowUseCase>(
    "Workflows/DeleteWorkflowUseCase"
);

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Params = DeleteWorkflowUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/useCases/inspectRouting/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { RoutingInspection } from "~/editor/domain/types.js";

export interface InspectRoutingUseCaseParams extends InspectRoutingParams {
    // The app whose routing the editor tests; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * What routing would do with an unsaved step config; the editor composes the sentences (R301).
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IInspectRoutingUseCase {
    execute(params: InspectRoutingUseCaseParams): Promise<RoutingInspection>;
}

export const InspectRoutingUseCase = createAbstraction<IInspectRoutingUseCase>(
    "Workflows/InspectRoutingUseCase"
);

export namespace InspectRoutingUseCase {
    export type Interface = IInspectRoutingUseCase;
    export type Params = InspectRoutingUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/useCases/folderExists/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";

export interface FolderExistsUseCaseParams extends FolderExistsParams {
    // The app whose folder a rule names; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * Whether a rule's folder still exists. Resolves `false` for a deleted folder (an answer, not an
 * error); throws a `GraphQLOperationError` for a server error or a missing answer, and the transport
 * `Error` as is (R346, R360).
 */
export interface IFolderExistsUseCase {
    execute(params: FolderExistsUseCaseParams): Promise<boolean>;
}

export const FolderExistsUseCase = createAbstraction<IFolderExistsUseCase>(
    "Workflows/FolderExistsUseCase"
);

export namespace FolderExistsUseCase {
    export type Interface = IFolderExistsUseCase;
    export type Params = FolderExistsUseCaseParams;
}
```

Create `packages/app-workflows/src/editor/gateway/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { EditorWorkflowDto } from "./dto.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

/*
 * The editor's area gateway (R343, R347): it hands each operation to the app gateway registered
 * for `params.app`, unwraps the envelope and returns the DTO. It throws a `GraphQLOperationError`
 * for an error envelope or a missing answer (R346) and lets the transport `Error`, and a plain
 * `Error` of the app gateway or of an app nobody registered, pass as they are. `folderExists`
 * resolves `false` as an answer.
 */
export interface IWorkflowEditorGateway {
    listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPageDto>;
    getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflowDto>;
    inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspectionDto>;
    folderExists(params: FolderExistsUseCase.Params): Promise<boolean>;
}

export const WorkflowEditorGateway = createAbstraction<IWorkflowEditorGateway>(
    "Workflows/WorkflowEditorGateway"
);

export namespace WorkflowEditorGateway {
    export type Interface = IWorkflowEditorGateway;
}
```

Create `packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.ts`:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import { WorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";

/*
 * Registration order (R349): this singleton collects the app gateways when it is first built, so
 * nothing may resolve it, the editor repository or an editor use case while the plugins render.
 * Route elements and editor components resolve it after every app has registered its gateway.
 *
 * Each method sends the app gateway exactly the parameters it took before the routing existed,
 * built field by field without `app` (R347), and unwraps the envelope once for every app (R346).
 */
class WorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private appGateways: WorkflowEditorAppGateway.Interface[]) {}

    async listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPageDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.listModels({
            search: params.search,
            limit: params.limit,
            after: params.after
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.getWorkflow(params.id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.storeWorkflow({
            data: params.data,
            savedOn: params.savedOn
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.deleteWorkflow(params.id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspectionDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.inspectRouting({
            stepConfig: params.stepConfig,
            requesterId: params.requesterId,
            folderId: params.folderId,
            modelId: params.modelId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async folderExists(params: FolderExistsUseCase.Params): Promise<boolean> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.folderExists({ id: params.id, type: params.type });
        // `false` is a valid answer, so only a missing answer (`null`, `undefined`) is an error.
        if (envelope.error || typeof envelope.data !== "boolean") {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    // The first registered app gateway of the app wins (A114); an app nobody registered is a plain error.
    private forApp(app: WorkflowAppKind): WorkflowEditorAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.app === app);
        if (!appGateway) {
            throw new Error(`No workflows app is registered for "${app}".`);
        }
        return appGateway;
    }
}

export const WorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowEditorGatewayImpl,
    dependencies: [[WorkflowEditorAppGateway, { multiple: true }]]
});
```

Create `packages/app-workflows/src/editor/repository/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

/*
 * The editor's area repository (R343): it calls `WorkflowEditorGateway` and maps the DTOs to the
 * editor's domain types. No cache. It lets every error of the gateway pass as it is.
 */
export interface IWorkflowEditorRepository {
    listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPage>;
    getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflow>;
    storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflow>;
    deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflow>;
    inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspection>;
    folderExists(params: FolderExistsUseCase.Params): Promise<boolean>;
}

export const WorkflowEditorRepository = createAbstraction<IWorkflowEditorRepository>(
    "Workflows/WorkflowEditorRepository"
);

export namespace WorkflowEditorRepository {
    export type Interface = IWorkflowEditorRepository;
}
```

Create `packages/app-workflows/src/editor/repository/WorkflowEditorRepository.ts`:

```ts
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapRoutingInspection } from "~/editor/gateway/mapRoutingInspection.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import { WorkflowEditorRepository as RepositoryAbstraction } from "./abstractions.js";

class WorkflowEditorRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowEditorGateway.Interface) {}

    async listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPage> {
        const dto = await this.gateway.listModels(params);
        return mapWorkflowModelPage(dto);
    }

    async getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.getWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.storeWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflow> {
        const dto = await this.gateway.deleteWorkflow(params);
        return mapEditorWorkflow(dto);
    }

    async inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspection> {
        const dto = await this.gateway.inspectRouting(params);
        return mapRoutingInspection(dto);
    }

    async folderExists(params: FolderExistsUseCase.Params): Promise<boolean> {
        return this.gateway.folderExists(params);
    }
}

export const WorkflowEditorRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowEditorRepositoryImpl,
    dependencies: [WorkflowEditorGateway]
});
```

Create `packages/app-workflows/src/editor/repository/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorGateway } from "~/editor/gateway/WorkflowEditorGateway.js";
import { WorkflowEditorRepository } from "./WorkflowEditorRepository.js";

// The editor's routing gateway and repository, both singletons (R344, R354); nothing to resolve.
export const WorkflowEditorRepositoryFeature = createFeature({
    name: "Workflows/WorkflowEditorRepository",
    register(container) {
        container.register(WorkflowEditorGateway).inSingletonScope();
        container.register(WorkflowEditorRepository).inSingletonScope();
    }
});
```

Create `packages/app-workflows/src/editor/useCases/listWorkflowModels/ListWorkflowModelsUseCase.ts`:

```ts
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<WorkflowModelPage> {
        return this.repository.listModels(params);
    }
}

export const ListWorkflowModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowModelsUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/listWorkflowModels/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowModelsUseCase } from "./ListWorkflowModelsUseCase.js";

export const ListWorkflowModelsFeature = createFeature({
    name: "Workflows/ListWorkflowModels",
    register(container) {
        container.register(ListWorkflowModelsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/useCases/getWorkflow/GetWorkflowUseCase.ts`:

```ts
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.getWorkflow(params);
    }
}

export const GetWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/getWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.ts`:

```ts
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class StoreWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.storeWorkflow(params);
    }
}

export const StoreWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/storeWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        container.register(StoreWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.ts`:

```ts
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.deleteWorkflow(params);
    }
}

export const DeleteWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/deleteWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/useCases/inspectRouting/InspectRoutingUseCase.ts`:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";

class InspectRoutingUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<RoutingInspection> {
        return this.repository.inspectRouting(params);
    }
}

export const InspectRoutingUseCase = UseCaseAbstraction.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/inspectRouting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

export const InspectRoutingFeature = createFeature({
    name: "Workflows/InspectRouting",
    register(container) {
        container.register(InspectRoutingUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/useCases/folderExists/FolderExistsUseCase.ts`:

```ts
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";

class FolderExistsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<boolean> {
        return this.repository.folderExists(params);
    }
}

export const FolderExistsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FolderExistsUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
```

Create `packages/app-workflows/src/editor/useCases/folderExists/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderExistsUseCase } from "./FolderExistsUseCase.js";

export const FolderExistsFeature = createFeature({
    name: "Workflows/FolderExists",
    register(container) {
        container.register(FolderExistsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/editor/feature.ts` (as Task 3 leaves it: it registers the config bridge `WorkflowConfigUseCases` and `WorkflowEditorToasts` and resolves `{ configUseCases, toasts }`).

Before:

```ts
import { createFeature } from "@webiny/feature/admin";
```

After:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorRepositoryFeature } from "./repository/feature.js";
import { DeleteWorkflowFeature } from "./useCases/deleteWorkflow/feature.js";
import { FolderExistsFeature } from "./useCases/folderExists/feature.js";
import { GetWorkflowFeature } from "./useCases/getWorkflow/feature.js";
import { InspectRoutingFeature } from "./useCases/inspectRouting/feature.js";
import { ListWorkflowModelsFeature } from "./useCases/listWorkflowModels/feature.js";
import { StoreWorkflowFeature } from "./useCases/storeWorkflow/feature.js";
```

Before:

```ts
        container.register(WorkflowEditorToasts).inSingletonScope();
```

After:

```ts
        container.register(WorkflowEditorToasts).inSingletonScope();
        WorkflowEditorRepositoryFeature.register(container);
        ListWorkflowModelsFeature.register(container);
        GetWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        InspectRoutingFeature.register(container);
        FolderExistsFeature.register(container);
```

Replace the block comment directly above `export const WorkflowEditorServicesFeature` (whatever Task 3 left there) with:

```ts
/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor's routing gateway and repository (singletons) and its six use cases
 * (transient), the config bridge and the editor toasts. The app packages register only their
 * editor gateway under `WorkflowEditorAppGateway` (R347).
 */
```

Modify `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts` (the bundle interface stays until Task 6):

Before:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts` (the bundle stays until Task 6):

Before:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
```

Before:

```ts
    constructor(private gateway: IWorkflowEditorGateway) {}
```

After:

```ts
    constructor(private gateway: WorkflowEditorAppGateway.Interface) {}
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts` (the bundle's test follows the moved type; it is deleted with the bundle in Task 6):

Before:

```ts
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
```

Before:

```ts
type FakeGateway = { [K in keyof IWorkflowEditorGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listModels: vi.fn(),
```

After:

```ts
type GatewayMethod = Exclude<keyof WorkflowEditorAppGateway.Interface, "app">;

type FakeGatewayMethods = { [K in GatewayMethod]: Mock };

interface FakeGateway extends FakeGatewayMethods {
    app: WorkflowAppKind;
}

const createFakeGateway = (): FakeGateway => {
    return {
        app: "cms",
        listModels: vi.fn(),
```

Before:

```ts
    method: keyof IWorkflowEditorGateway;
```

After:

```ts
    method: GatewayMethod;
```

Before:

```ts
        const GatewayA = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayA");
        const GatewayB = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayB");
```

After:

```ts
        const GatewayA = createAbstraction<WorkflowEditorAppGateway.Interface>(
            "Test/EditorGatewayA"
        );
        const GatewayB = createAbstraction<WorkflowEditorAppGateway.Interface>(
            "Test/EditorGatewayB"
        );
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/abstractions.ts` (the per-app token stays until Task 6) — replace the whole file with:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";

export const CmsWorkflowEditorGateway = createAbstraction<WorkflowEditorAppGateway.Interface>(
    "Cms/Workflows/WorkflowEditorGateway"
);

export namespace CmsWorkflowEditorGateway {
    export type Interface = WorkflowEditorAppGateway.Interface;
}
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.ts`:

Before:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { WorkflowAppKind } from "@webiny/app-workflows/domain/WorkflowAppKind.js";
```

Before:

```ts
class CmsWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}
```

After:

```ts
class CmsWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    // The routing `WorkflowEditorGateway` picks this gateway for `app: "cms"` (R347).
    public readonly app: WorkflowAppKind = "cms";

    constructor(private client: MainGraphQLClient.Interface) {}
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts`:

Before:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/abstractions.ts` — replace the whole file with:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";

export const WbWorkflowEditorGateway = createAbstraction<WorkflowEditorAppGateway.Interface>(
    "WebsiteBuilder/Workflows/WorkflowEditorGateway"
);

export namespace WbWorkflowEditorGateway {
    export type Interface = WorkflowEditorAppGateway.Interface;
}
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.ts`:

Before:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { WorkflowAppKind } from "@webiny/app-workflows/domain/WorkflowAppKind.js";
```

Before:

```ts
class WbWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}
```

After:

```ts
class WbWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    // The routing `WorkflowEditorGateway` picks this gateway for `app: "wb"` (R347).
    public readonly app: WorkflowAppKind = "wb";

    constructor(private client: MainGraphQLClient.Interface) {}
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts`:

Before:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
```

After:

```ts
import type { FolderExistsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
```

Check that nothing imports the old path any more (expect no output):

```bash
grep -rn "editor/gateway/IWorkflowEditorGateway\|WorkflowEditorAppKind" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/listWorkflowModels/ListWorkflowModelsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/getWorkflow/GetWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/inspectRouting/InspectRoutingUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/folderExists/FolderExistsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
```

Expected: PASS for each.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepTypeOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: every test file passes unchanged in its assertions (the bundle, the per-app bindings and the editor presenter still run as before); the three builds print no TypeScript error (the build type-checks the co-located tests, 8a R243).

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
git commit -m "refactor(app-workflows): add the editor data layer behind a routing gateway" -m "WorkflowAppKind replaces WorkflowEditorAppKind. The app editor gateway contract moves to editor/appGateway with the shared WorkflowEditorAppGateway token and an app field. WorkflowEditorGateway routes each operation by app and unwraps the envelope once, WorkflowEditorRepository maps the DTOs, and six use cases run one operation each. app-headless-cms-workflows and app-website-builder-workflows: the editor gateways declare their app and import the moved types; they stay on their per-app tokens until the editor moves to the use cases." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes or fails, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Method names.** The contract fixes the six operations but not the method names of `IWorkflowEditorGateway` and `IWorkflowEditorRepository`. Both keep the app gateway's names (`listModels`, `getWorkflow`, `storeWorkflow`, `deleteWorkflow`, `inspectRouting`, `folderExists`); only the use case is named `ListWorkflowModelsUseCase` (R348 #10).
- **Fakes.** R355 names the fakes' shape, not their files. This task adds `[AWET]/fakeWorkflowEditorAppGateway.ts` (`createFakeEditorAppGateway(app)`, used by `WorkflowEditorGateway.test.ts` and by Task 6's index tests as the other app's stub) and `[AWET]/fakeWorkflowEditorGateway.ts` (`createFakeEditorGateway()`, the area gateway double of the use-case tests). Each fakes one gateway (one abstraction), not a bundle of use cases.
- **Moved error cases.** The envelope conversion moved from the bundle to the routing gateway, so the bundle test's "error mapping (R204)" cases (error envelope, neither data nor error, transport) and the conflict, validation-with-rule-id and blocked-delete cases are ported to `WorkflowEditorGateway.test.ts`; the use-case tests assert that the use case passes the gateway's error through unchanged. The bundle's own test keeps running until Task 6 deletes it with the bundle.
- **`[AWE]/feature.ts` before-text.** Task 3 rewrites this file (it stops registering the config gateway). The hunks above anchor on two lines Task 3 does not change (`import { createFeature } ...` and `container.register(WorkflowEditorToasts).inSingletonScope();`) and replace the doc comment as a whole. Verify after Task 3 that both anchor lines are still present.
- **`[AWE]/feature.test.ts`** is not changed here: its cases are Task 3's (R364); the new registrations are asserted from the composition root in `[AW]/app.test.tsx`.
- **Per-app token files.** The contract says they are "retyped to `IWorkflowEditorAppGateway`"; they are typed through the namespace (`WorkflowEditorAppGateway.Interface`, `reach-abstractions-through-the-namespace.md`), the same type.

## Review fixes (sub-phase review)

- **No nested call arguments.** `createFakeEditorAppGateway` and `createFakeEditorGateway` built their default DTOs inside `mockResolvedValue(...)`; they now build `page`, `workflow` and `inspection` first. The same in the tests: the A114 case of `WorkflowEditorGateway.test.ts` (`firstWorkflow`), `ListWorkflowModelsUseCase.test.ts` (`articleRow`, `authorRow`, `pageDto`), `GetWorkflowUseCase.test.ts` (`dto`, `expected`), `StoreWorkflowUseCase.test.ts` (`stored`), `DeleteWorkflowUseCase.test.ts` (`deleted`) and `InspectRoutingUseCase.test.ts` (`dto`, `expected`). Assertions unchanged.
- **One test command at a time.** The test runner note now says the commands of each block run one at a time, in order.
